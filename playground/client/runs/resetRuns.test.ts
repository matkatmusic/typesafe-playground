import { test, expect, afterEach, describe } from 'bun:test';
import { resetVersionRuns } from './resetRuns';
import { pageState } from '../page/state';

function removeFakeState(realFetch: typeof fetch) {
    Reflect.deleteProperty(globalThis, 'document');
    Reflect.deleteProperty(globalThis, 'confirm');
    globalThis.fetch = realFetch;
    pageState.isDirty = false;
    pageState.pinnedIndex = null;
    pageState.versions = [];
    pageState.index = 0;
}

function buildRanVersion() {
    return { time: 't', state: {}, questions: {}, calls: 2, outputs: [{}, {}], note: 'n' };
}

function installFakeConfirm(answer: boolean) {
    Object.assign(globalThis, { confirm: () => answer });
}

function installFakeLabelDocument() {
    const elements = { lastEditedLabel: { textContent: '' } };
    const getById = (id: keyof typeof elements) => elements[id];
    Object.assign(globalThis, { document: { getElementById: getById } });
    return elements;
}

function installRecordingFetch() {
    const seen = { path: '', body: '' };
    async function fetchRecordedResponse(path: string | URL | Request, init?: RequestInit) {
        seen.path = String(path);
        seen.body = String(init?.body);
        return Response.json({ ...buildRanVersion(), calls: 0, outputs: [] });
    }
    globalThis.fetch = fetchRecordedResponse as typeof fetch;
    return seen;
}

async function validateDeclinedConfirmDoesNotCallTheServer() {
    let fetchCount = 0;
    async function fetchCountedResponse() {
        fetchCount++;
        return new Response('{}');
    }
    globalThis.fetch = fetchCountedResponse as unknown as typeof fetch;
    installFakeConfirm(false);
    pageState.versions = [buildRanVersion()] as never;
    await resetVersionRuns();
    expect(fetchCount).toBe(0);
    expect(pageState.isDirty).toBe(false);
    expect(pageState.versions[0].outputs.length).toBe(2);
}

async function validateConfirmedResetPostsTheIdStoresTheClearedVersionAndMarksTheChange() {
    const elements = installFakeLabelDocument();
    installFakeConfirm(true);
    const seen = installRecordingFetch();
    pageState.versions = [buildRanVersion()] as never;
    // the page draw after the state change needs a real document, so it throws here
    await expect(resetVersionRuns()).rejects.toThrow();
    expect(seen.path).toBe('/reset-runs');
    expect(JSON.parse(seen.body)).toEqual({ index: 0 });
    expect(pageState.versions[0].outputs).toEqual([]);
    expect(pageState.versions[0].calls).toBe(0);
    expect(pageState.versions[0].note).toBe('n');
    expect(pageState.isDirty).toBe(true);
    expect(elements.lastEditedLabel.textContent).toContain('last edited: ');
}

async function validateResetUnpinsOnlyThePinnedVersion() {
    Object.assign(globalThis, { document: { getElementById: () => ({ textContent: '' }) } });
    installFakeConfirm(true);
    installRecordingFetch();
    pageState.versions = [buildRanVersion()] as never;
    pageState.pinnedIndex = 9;
    await expect(resetVersionRuns()).rejects.toThrow();
    expect(pageState.pinnedIndex).toBe(9);
    pageState.pinnedIndex = 0;
    await expect(resetVersionRuns()).rejects.toThrow();
    expect(pageState.pinnedIndex).toBeNull();
}

function registerResetRunsTests() {
    afterEach(removeFakeState.bind(null, globalThis.fetch));
    test('test_reset_unpins_only_the_pinned_version', validateResetUnpinsOnlyThePinnedVersion);
    test('test_declined_confirm_does_not_call_the_server', validateDeclinedConfirmDoesNotCallTheServer);
    test('test_confirmed_reset_posts_the_id_stores_the_cleared_version_and_marks_the_change', validateConfirmedResetPostsTheIdStoresTheClearedVersionAndMarksTheChange);
}

describe('resetRuns', registerResetRunsTests);
