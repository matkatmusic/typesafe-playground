import { describe, test, expect, afterEach, spyOn } from 'bun:test';
import type { EditorView } from '@codemirror/view';
import * as editors from '../editors/editors';
import { pageState } from '../page/state';
import { installFakeDom, installPage, removeFakeState, triggerNewButtonClick } from './notesButtonSupport';

function validateButtonLooksLikeAFormatButtonAndOpensTheDialogWithTheSavedNote() {
    const { dialog, title, textArea } = installFakeDom();
    installPage('{"a":1}');
    const button = triggerNewButtonClick();
    expect(button.id).toBe('stateNotesButton');
    expect(button.className).toBe('format-json-button');
    expect(button.textContent).toBe('notes');
    expect(dialog.isOpen).toBe(true);
    expect(title.textContent).toBe('State notes');
    expect(textArea.value).toBe('saved');
}

function validateQuestionsButtonStartsWithTheQuestionsNoteAndPendingText() {
    const { textArea } = installFakeDom();
    installPage('{"a":1}');
    pageState.versions[0].questionsNote = 'questions saved';
    triggerNewButtonClick({ kind: 'questions' });
    expect(textArea.value).toBe('questions saved');
    spyOn(editors, 'getQuestionsEditor').mockReturnValue({ state: { doc: { toString: () => '{"q":2}' } } } as unknown as EditorView);
    pageState.pendingNotes.questions = 'questions pending';
    triggerNewButtonClick({ kind: 'questions' });
    expect(textArea.value).toBe('questions pending');
}

function validateResultButtonStartsWithItsQuestionNoteEvenWithUnrunEdits() {
    const { textArea, title } = installFakeDom();
    installPage('{"a":2}');
    pageState.versions[0].resultNotes = { needsTask: 'result saved' };
    pageState.pendingNotes.state = 'pending';
    triggerNewButtonClick({ kind: 'result', question: 'needsTask' });
    expect(textArea.value).toBe('result saved');
    expect(title.textContent).toBe('State notes');
    triggerNewButtonClick({ kind: 'result', question: 'other' });
    expect(textArea.value).toBe('');
}

function registerNotesButtonOpeningTests() {
    afterEach(removeFakeState);
    test('test_questions_button_starts_with_the_questions_note_and_pending_text', validateQuestionsButtonStartsWithTheQuestionsNoteAndPendingText);
    test('test_result_button_starts_with_its_question_note_even_with_unrun_edits', validateResultButtonStartsWithItsQuestionNoteEvenWithUnrunEdits);
    test('test_button_looks_like_a_format_button_and_opens_the_dialog_with_the_saved_note', validateButtonLooksLikeAFormatButtonAndOpensTheDialogWithTheSavedNote);
}

describe('notes button opening', registerNotesButtonOpeningTests);
