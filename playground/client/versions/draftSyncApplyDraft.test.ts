import { test, expect, afterEach, spyOn, describe } from 'bun:test';
import * as batchControls from '../batch/batchControls';
import { applyDraft } from './draftSync';
import * as editors from '../editors/editors';
import { pageState } from '../page/state';
import * as versionBox from './versionBox';
import { removeFakeState, installStubEditors, installFakeLabel } from './draftSyncFakes';

function applyNoop() {}

function validateApplyDraftDoesNothingForNullOrEqualText() {
    installStubEditors('s', 'q');
    const replaceSpy = spyOn(editors, 'fillEditorText').mockImplementation(applyNoop);
    const refreshSpy = spyOn(versionBox, 'refreshVersionBox').mockImplementation(applyNoop);
    applyDraft(null);
    applyDraft({ state: 's', questions: 'q', isBatch: false });
    expect(replaceSpy).not.toHaveBeenCalled();
    expect(refreshSpy).not.toHaveBeenCalled();
    expect(pageState.isDirty).toBe(false);
}

function validateApplyDraftReplacesOnlyTheDifferingEditorAndMarksTheChangeOnce() {
    const { stateEditor, questionsEditor } = installStubEditors('s', 'q');
    const label = installFakeLabel();
    const replaceSpy = spyOn(editors, 'fillEditorText').mockImplementation(applyNoop);
    const refreshSpy = spyOn(versionBox, 'refreshVersionBox').mockImplementation(applyNoop);
    applyDraft({ state: 's', questions: 'q draft', isBatch: false });
    expect(replaceSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).toHaveBeenCalledWith(questionsEditor, 'q draft');
    expect(replaceSpy).not.toHaveBeenCalledWith(stateEditor, 's');
    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(pageState.isDirty).toBe(true);
    expect(label.textContent).toContain('last edited: ');
}

async function validateApplyDraftWithBatchOnRestoresTheToggleAndTheText() {
    // Step: the saved draft holds an array text and isBatch true.
    const { stateEditor } = installStubEditors('{"a": 1}', 'q');
    installFakeLabel();
    const fillSpy = spyOn(editors, 'fillEditorText').mockImplementation(applyNoop);
    spyOn(versionBox, 'refreshVersionBox').mockImplementation(applyNoop);
    const batchSpy = spyOn(batchControls, 'applyBatchMode').mockImplementation(applyNoop);
    applyDraft({ state: '[{"a": 1}]', questions: 'q', isBatch: true });
    // Step: the text is filled in and the toggle is switched on.
    expect(fillSpy).toHaveBeenCalledWith(stateEditor, '[{"a": 1}]');
    expect(batchSpy).toHaveBeenCalledWith(true);
    expect(pageState.isDirty).toBe(true);
}

function validateApplyDraftWithOnlyTheToggleDifferentStillRestoresIt() {
    installStubEditors('s', 'q');
    installFakeLabel();
    spyOn(editors, 'fillEditorText').mockImplementation(applyNoop);
    spyOn(versionBox, 'refreshVersionBox').mockImplementation(applyNoop);
    const batchSpy = spyOn(batchControls, 'applyBatchMode').mockImplementation(applyNoop);
    applyDraft({ state: 's', questions: 'q', isBatch: true });
    expect(batchSpy).toHaveBeenCalledWith(true);
}

function registerApplyDraftTests() {
    afterEach(removeFakeState);
    test('test_apply_draft_with_batch_on_restores_the_toggle_and_the_text', validateApplyDraftWithBatchOnRestoresTheToggleAndTheText);
    test('test_apply_draft_with_only_the_toggle_different_still_restores_it', validateApplyDraftWithOnlyTheToggleDifferentStillRestoresIt);
    test('test_apply_draft_does_nothing_for_null_or_equal_text', validateApplyDraftDoesNothingForNullOrEqualText);
    test('test_apply_draft_replaces_only_the_differing_editor_and_marks_the_change_once', validateApplyDraftReplacesOnlyTheDifferingEditorAndMarksTheChangeOnce);
}

describe('draftSync applyDraft', registerApplyDraftTests);
