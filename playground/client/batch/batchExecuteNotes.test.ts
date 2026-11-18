import { test, expect, afterEach, describe } from 'bun:test';
import { pageState } from '../page/state';
import { executeSubmitBatch } from './submitBatch';
import { getQuestions, buildVersion, installHarness, resetHarness, enableBatch } from './submitBatchHarness.test';

function collectSavedNoteSummary(notes: { index: number; body: Record<string, unknown> }[]) {
    const noteIndexes: number[] = [];
    let everyNoteHasQuestionsNote = true;
    let someNoteHasStateNote = false;
    for (const note of notes) {
        noteIndexes.push(note.index);
        const hasShownQuestionsNote = note.body.questionsNote === 'q note';
        if (!hasShownQuestionsNote)
            everyNoteHasQuestionsNote = false;
        const hasStateNote = 'stateNote' in note.body;
        if (hasStateNote)
            someNoteHasStateNote = true;
    }
    return { noteIndexes, everyNoteHasQuestionsNote, someNoteHasStateNote };
}

async function validateNewVersionsGetTheShownQuestionsNoteWhenQuestionsAreUnchanged() {
    // Step: the shown version has results, a questions note and a state note.
    const shown = buildVersion({ a: 1 }, getQuestions(), 1, 't');
    shown.questionsNote = 'q note';
    shown.stateNote = 's note';
    const harness = installHarness([shown], 0, '[{"a":2},{"a":3}]', JSON.stringify(getQuestions()), []);
    enableBatch();
    await executeSubmitBatch();
    // Step: both new versions get the questions note, and no new version gets a state note.
    const summary = collectSavedNoteSummary(harness.notes);
    expect(summary.noteIndexes).toEqual([1, 2]);
    expect(summary.everyNoteHasQuestionsNote).toBe(true);
    expect(summary.someNoteHasStateNote).toBe(false);
    expect(pageState.versions[1].stateNote).toBeUndefined();
    expect(pageState.versions[0].questionsNote).toBe('q note');
}

async function validateNoNoteIsCopiedWhenTheQuestionsChanged() {
    const shown = buildVersion({ a: 1 }, getQuestions(), 1, 't');
    shown.questionsNote = 'q note';
    const harness = installHarness([shown], 0, '[{"a":2}]', JSON.stringify({ other: { type: 'noul' } }), []);
    enableBatch();
    await executeSubmitBatch();
    expect(harness.notes).toEqual([]);
}

async function validateKeptAndOverwrittenVersionsKeepTheirOwnNotesAndGetNoCopy() {
    const shown = buildVersion({ a: 1 }, getQuestions(), 1, 't');
    shown.questionsNote = 'q note';
    const harness = installHarness([shown], 0, '[{"a":1}]', JSON.stringify(getQuestions()), []);
    enableBatch();
    await executeSubmitBatch();
    expect(harness.notes).toEqual([]);
    expect(pageState.versions[0].questionsNote).toBe('q note');
}

function registerExecuteNotesTests() {
    afterEach(resetHarness);
    test('test_new_versions_get_the_shown_questions_note_when_questions_are_unchanged', validateNewVersionsGetTheShownQuestionsNoteWhenQuestionsAreUnchanged);
    test('test_no_note_is_copied_when_the_questions_changed', validateNoNoteIsCopiedWhenTheQuestionsChanged);
    test('test_kept_and_overwritten_versions_keep_their_own_notes_and_get_no_copy', validateKeptAndOverwrittenVersionsKeepTheirOwnNotesAndGetNoCopy);
}

describe('batch execute notes', registerExecuteNotesTests);
