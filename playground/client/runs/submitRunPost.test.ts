import { test, expect, afterEach, describe, spyOn } from 'bun:test';
import * as editors from '../editors/editors';
import * as graphs from '../graphs/graphs';
import * as winnersDom from './winnersDom';
import { pageState } from '../page/state';
import { executeSubmit, getRunningText, getSubmitText } from './submit';
import { getIsoTime, getVersion, buildStubStateEditor, installFakeDom, removeFakeDom } from './submitFakeDom';

type Elements = ReturnType<typeof installFakeDom>;
interface SeenRequest { body: string, wasDisabledWhileRunning: boolean, textWhileRunning: string }

function buildShownValueRecorder(shownValues: unknown[]) {
    function pushShownValue(value: unknown) {
        shownValues.push(value);
    }
    return pushShownValue;
}

function renderNothing() {}

function installRunSpies(shownValues: unknown[]) {
    const pushShownValue = buildShownValueRecorder(shownValues);
    return [
        spyOn(editors, 'renderResultJson').mockImplementation(pushShownValue),
        spyOn(graphs, 'renderGraphs').mockImplementation(renderNothing),
        spyOn(winnersDom, 'renderWinners').mockImplementation(renderNothing),
        spyOn(editors, 'renderStateJson').mockImplementation(pushShownValue),
        spyOn(editors, 'getStateEditor').mockReturnValue(buildStubStateEditor('{"a":1}')),
        spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildStubStateEditor('{"q":{"type":"noul"}}')),
    ];
}

function resetSpies(spies: ReturnType<typeof installRunSpies>) {
    for (const spy of spies) {
        spy.mockRestore();
    }
}

function setUpRunState(elements: Elements) {
    pageState.versions = [getVersion()];
    pageState.index = 0;
    elements.callsPicker.value = '3';
    pageState.isDirty = false;
}

function installStubFetch(elements: Elements, newVersion: ReturnType<typeof getVersion>) {
    const seen: SeenRequest = { body: '', wasDisabledWhileRunning: false, textWhileRunning: '' };
    async function fetchStubbedRun(_path: string, init?: RequestInit) {
        seen.wasDisabledWhileRunning = elements.submitButton.disabled;
        seen.textWhileRunning = elements.submitButton.textContent;
        seen.body = String(init?.body);
        return Response.json({ outputs: getVersion().outputs, version: newVersion, index: 1 });
    }
    globalThis.fetch = fetchStubbedRun as unknown as typeof fetch;
    return seen;
}

function assertRequestAndButton(seen: SeenRequest, elements: Elements) {
    expect(JSON.parse(seen.body)).toEqual({ index: 0, calls: 3, apiKey: '', provider: 'TypeSafe', state: { a: 1 }, questions: { q: { type: 'noul' } } });
    expect(seen.wasDisabledWhileRunning).toBe(true);
    expect(seen.textWhileRunning).toBe(getRunningText());
    expect(elements.submitButton.disabled).toBe(false);
    expect(elements.submitButton.textContent).toBe(getSubmitText());
}

function assertLabelsAndShownValues(elements: Elements, shownValues: unknown[]) {
    expect(elements.costLabel.textContent).toBe('Cost: $0.042000');
    expect(elements.tokensLabel.textContent).toBe('Tokens: 1000000');
    expect(shownValues).toEqual([getVersion().state, getVersion().outputs]);
    expect(elements.errorLine.textContent).toBe('');
    expect(elements.lastEditedLabel.textContent.startsWith('last run: ')).toBe(true);
    expect(elements.versionLabel.textContent).toBe(`version 2 of 2 · ${new Date(getIsoTime()).toLocaleString()} · 1 call`);
}

function assertVersionsAfterRun(newVersion: ReturnType<typeof getVersion>) {
    expect(pageState.isDirty).toBe(true);
    expect(pageState.versions.length).toBe(2);
    expect(pageState.versions[1]).toEqual(newVersion);
    expect(pageState.index).toBe(1);
}

async function validateSubmitPostsRunAndShowsTheOutputsAndLabels() {
    const elements = installFakeDom(true);
    const shownValues: unknown[] = [];
    const spies = installRunSpies(shownValues);
    const newVersion = { ...getVersion() };
    setUpRunState(elements);
    const seen = installStubFetch(elements, newVersion);
    await executeSubmit();
    resetSpies(spies);
    assertRequestAndButton(seen, elements);
    assertLabelsAndShownValues(elements, shownValues);
    assertVersionsAfterRun(newVersion);
}

function registerSubmitRunPostTests() {
    afterEach(removeFakeDom);
    test('test_submit_posts_run_and_shows_the_outputs_and_labels', validateSubmitPostsRunAndShowsTheOutputsAndLabels);
}

describe('submitRunPost', registerSubmitRunPostTests);
