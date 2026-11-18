import { describe, test, expect, afterEach, spyOn } from 'bun:test';
import { launchDraftSession } from './draftSync';
import * as editors from '../editors/editors';
import { pageState } from '../page/state';
import * as versionBox from './versionBox';
import { getSessionId, removeFakeState, installStubEditors, installFakeLabel, installFakeSessionStorage, installFetchRecorder, installStubSetInterval } from './draftSyncFakes';

function applyNoop() {}

async function validateStartDraftSessionCreatesAndStoresAnIdWithoutRestoring() {
    installStubEditors('s', 'q');
    const stored = installFakeSessionStorage({});
    const seen = installFetchRecorder(null);
    const intervalSpy = installStubSetInterval();
    await launchDraftSession();
    expect(stored.playgroundSessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(seen).toEqual([]);
    expect(intervalSpy.mock.calls[0][1]).toBe(2000);
}

async function validateStartDraftSessionRestoresTheDraftOfAnExistingId() {
    const { questionsEditor } = installStubEditors('s', 'q');
    installFakeSessionStorage({ playgroundSessionId: getSessionId() });
    installFakeLabel();
    const seen = installFetchRecorder({ state: 's', questions: 'q draft' });
    installStubSetInterval();
    const replaceSpy = spyOn(editors, 'fillEditorText').mockImplementation(applyNoop);
    spyOn(versionBox, 'refreshVersionBox').mockImplementation(applyNoop);
    await launchDraftSession();
    expect(seen).toEqual([{ path: `/draft?id=${getSessionId()}`, method: 'GET', body: null }]);
    expect(replaceSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).toHaveBeenCalledWith(questionsEditor, 'q draft');
    expect(pageState.isDirty).toBe(true);
}

function registerLaunchSessionTests() {
    afterEach(removeFakeState);
    test('test_start_draft_session_creates_and_stores_an_id_without_restoring', validateStartDraftSessionCreatesAndStoresAnIdWithoutRestoring);
    test('test_start_draft_session_restores_the_draft_of_an_existing_id', validateStartDraftSessionRestoresTheDraftOfAnExistingId);
}

describe('launchDraftSession', registerLaunchSessionTests);
