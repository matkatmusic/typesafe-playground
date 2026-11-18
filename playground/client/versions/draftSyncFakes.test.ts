import { test, expect, afterEach, describe } from 'bun:test';
import { pageState } from '../page/state';
import { getSessionId, removeFakeState, installStubEditors, installFakeLabel, installFakeSessionStorage, installFetchRecorder, installStubSetInterval } from './draftSyncFakes';

function validateGetSessionIdReturnsAFixedUuid() {
    expect(getSessionId()).toBe('0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d');
    expect(getSessionId()).toBe(getSessionId());
}

function validateStubEditorsReturnTheirCurrentText() {
    // Step: install the stub editors with starting text.
    const editors = installStubEditors('state one', 'question one');
    expect(editors.stateEditor.state.doc.toString()).toBe('state one');
    expect(editors.questionsEditor.state.doc.toString()).toBe('question one');
    // Step: change the text and read it back through the editor.
    editors.stateTexts.value = 'state two';
    expect(editors.stateEditor.state.doc.toString()).toBe('state two');
}

function validateFakeLabelIsReturnedByGetElementById() {
    const label = installFakeLabel();
    const found = document.getElementById('anything');
    expect(found).toBe(label as unknown as HTMLElement);
    expect(label.textContent).toBe('');
}

function validateFakeSessionStorageReadsAndWrites() {
    // Step: the initial values can be read, and a missing key gives null.
    const stored = installFakeSessionStorage({ playgroundSessionId: 'abc' });
    expect(sessionStorage.getItem('playgroundSessionId')).toBe('abc');
    expect(sessionStorage.getItem('missing')).toBeNull();
    // Step: a written value shows in the returned record.
    sessionStorage.setItem('other', 'xyz');
    expect(stored.other).toBe('xyz');
}

async function validateFetchRecorderRecordsRequestsAndReturnsTheDraft() {
    const seen = installFetchRecorder({ draft: 1 });
    const response = await fetch('/draft', { method: 'POST', body: JSON.stringify({ a: 1 }) });
    expect(await response.json()).toEqual({ draft: 1 });
    await fetch('/other');
    expect(seen).toEqual([
        { path: '/draft', method: 'POST', body: { a: 1 } },
        { path: '/other', method: 'GET', body: null }
    ]);
}

function validateStubSetIntervalDoesNotRunTheCallback() {
    const spy = installStubSetInterval();
    let wasCalled = false;
    function markCalled() {
        wasCalled = true;
    }
    const result = setInterval(markCalled, 1);
    expect(result).toBe(0 as unknown as ReturnType<typeof setInterval>);
    expect(wasCalled).toBe(false);
    expect(spy).toHaveBeenCalledTimes(1);
}

function validateRemoveFakeStateRestoresGlobalsAndClearsDirtyFlag() {
    const realFetch = globalThis.fetch;
    installFetchRecorder(null);
    installFakeLabel();
    installFakeSessionStorage({});
    pageState.isDirty = true;
    expect(globalThis.fetch).not.toBe(realFetch);
    removeFakeState();
    expect(globalThis.fetch).toBe(realFetch);
    expect('document' in globalThis).toBe(false);
    expect('sessionStorage' in globalThis).toBe(false);
    expect(pageState.isDirty).toBe(false);
}

function registerDraftSyncFakesTests() {
    afterEach(removeFakeState);
    test('test_get_session_id_returns_a_fixed_uuid', validateGetSessionIdReturnsAFixedUuid);
    test('test_stub_editors_return_their_current_text', validateStubEditorsReturnTheirCurrentText);
    test('test_fake_label_is_returned_by_get_element_by_id', validateFakeLabelIsReturnedByGetElementById);
    test('test_fake_session_storage_reads_and_writes', validateFakeSessionStorageReadsAndWrites);
    test('test_fetch_recorder_records_requests_and_returns_the_draft', validateFetchRecorderRecordsRequestsAndReturnsTheDraft);
    test('test_stub_set_interval_does_not_run_the_callback', validateStubSetIntervalDoesNotRunTheCallback);
    test('test_remove_fake_state_restores_globals_and_clears_dirty_flag', validateRemoveFakeStateRestoresGlobalsAndClearsDirtyFlag);
}

describe('draftSyncFakes', registerDraftSyncFakesTests);
