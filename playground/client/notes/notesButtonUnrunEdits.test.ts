import { describe, test, expect, afterEach, spyOn } from 'bun:test';
import type { EditorView } from '@codemirror/view';
import * as editors from '../editors/editors';
import { pageState } from '../page/state';
import { installFakeDom, installPage, removeFakeState, triggerNewButtonClick } from './notesButtonSupport';

function validateUnrunEditsStartWithThePendingText() {
    const { textArea } = installFakeDom();
    installPage('{"a":2}');
    pageState.pendingNotes.state = 'pending';
    triggerNewButtonClick();
    expect(textArea.value).toBe('pending');
}

function validateUnrunEditsWithoutPendingTextStartEmptyWhenTheStateChanged() {
    const { textArea } = installFakeDom();
    installPage('{"a":2}');
    triggerNewButtonClick();
    expect(textArea.value).toBe('');
}

function validateUnrunEditsToOtherTextKeepTheBaseNoteWhenTheStateIsUnchanged() {
    const { textArea } = installFakeDom();
    installPage('{"a":1}');
    spyOn(editors, 'getQuestionsEditor').mockReturnValue({ state: { doc: { toString: () => '{"q":1}' } } } as unknown as EditorView);
    triggerNewButtonClick();
    expect(textArea.value).toBe('saved');
}

function validateOkWithUnrunEditsKeepsThePendingText() {
    const { dialog, textArea } = installFakeDom();
    installPage('{"a":2}');
    triggerNewButtonClick();
    textArea.value = 'typed';
    dialog.returnValue = 'ok';
    dialog.closeListener?.();
    expect(pageState.pendingNotes.state).toBe('typed');
    expect(pageState.versions[0].stateNote).toBe('saved');
}

function registerNotesButtonUnrunEditsTests() {
    afterEach(removeFakeState);
    test('test_unrun_edits_start_with_the_pending_text', validateUnrunEditsStartWithThePendingText);
    test('test_unrun_edits_without_pending_text_start_empty_when_the_state_changed', validateUnrunEditsWithoutPendingTextStartEmptyWhenTheStateChanged);
    test('test_unrun_edits_to_other_text_keep_the_base_note_when_the_state_is_unchanged', validateUnrunEditsToOtherTextKeepTheBaseNoteWhenTheStateIsUnchanged);
    test('test_ok_with_unrun_edits_keeps_the_pending_text', validateOkWithUnrunEditsKeepsThePendingText);
}

describe('notes button unrun edits', registerNotesButtonUnrunEditsTests);
