import { test, expect, afterEach, describe, mock, spyOn } from 'bun:test';
import type { EditorView } from '@codemirror/view';
import { launchDraftSession, syncDraftOnTick } from './draftSync';
import * as editors from '../editors/editors';
import { pageState } from '../page/state';

function getSessionId() {
    return '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
}

function resetFetch(realFetch: typeof fetch) {
    globalThis.fetch = realFetch;
}

function removeFakeState() {
    mock.restore();
    Reflect.deleteProperty(globalThis, 'sessionStorage');
    pageState.versions = [];
    pageState.index = 0;
    pageState.editedDraft = null;
}

function buildStubEditor(text: string) {
    return { state: { doc: { toString: () => text } } } as unknown as EditorView;
}

function installBodyRecordingFetch(seenBodies: unknown[]) {
    globalThis.fetch = (async (_path: string, init?: RequestInit) => {
        seenBodies.push(init?.body === undefined ? null : JSON.parse(String(init.body)));
        return Response.json(null);
    }) as unknown as typeof fetch;
}

async function launchSessionAndClearRecorder() {
    pageState.versions = [{ time: 't', state: { a: 1 }, questions: { q: 1 } as never, calls: 1, outputs: [] }];
    pageState.index = 0;
    spyOn(editors, 'getStateEditor').mockReturnValue(buildStubEditor('{"a":1}'));
    spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildStubEditor('{"q":1}'));
    Object.assign(globalThis, { sessionStorage: { getItem: () => getSessionId(), setItem: () => {} } });
    const seenBodies: unknown[] = [];
    installBodyRecordingFetch(seenBodies);
    spyOn(globalThis, 'setInterval').mockImplementation((() => 0) as unknown as typeof setInterval);
    await launchDraftSession();
    await new Promise((resolve) => setTimeout(resolve, 10));
    seenBodies.length = 0;
    return seenBodies;
}

async function validateTickSendsTheKeptDraftTextsWhenARealVersionIsShown() {
    const seenBodies = await launchSessionAndClearRecorder();
    syncDraftOnTick();
    expect(seenBodies).toEqual([]);
    pageState.editedDraft = { state: '{"a": 2}', questions: '{"q": 1}', baseIndex: 0 };
    syncDraftOnTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(seenBodies).toEqual([{ id: getSessionId(), state: '{"a": 2}', questions: '{"q": 1}', isBatch: false }]);
    syncDraftOnTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(seenBodies.length).toBe(1);
}

function registerDraftTickKeptDraftTests() {
    afterEach(resetFetch.bind(null, globalThis.fetch));
    afterEach(removeFakeState);
    test('test_tick_sends_the_kept_draft_texts_when_a_real_version_is_shown', validateTickSendsTheKeptDraftTextsWhenARealVersionIsShown);
}

describe('draftSync tick kept draft', registerDraftTickKeptDraftTests);
