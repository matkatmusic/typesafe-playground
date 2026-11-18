import { test, expect, afterEach } from 'bun:test';
import { pageState } from '../page/state';
import { executeSubmitBatch } from './submitBatch';
import { QUESTIONS, buildVersion, installHarness, restoreHarness, startBatchOn } from './submitBatchHarness.test';

afterEach(restoreHarness);

async function validateNewVersionsGetTheShownQuestionsNoteWhenQuestionsAreUnchanged() {
  // Step: the shown version has results, a questions note and a state note.
  const shown = buildVersion({ a: 1 }, QUESTIONS, 1, 't');
  shown.questionsNote = 'q note';
  shown.stateNote = 's note';
  const harness = installHarness([shown], 0, '[{"a":2},{"a":3}]', JSON.stringify(QUESTIONS), []);
  startBatchOn();
  await executeSubmitBatch();
  // Step: both new versions get the questions note, and no new version gets a state note.
  expect(harness.notes.map((note) => note.index)).toEqual([1, 2]);
  expect(harness.notes.every((note) => note.body.questionsNote === 'q note')).toBe(true);
  expect(harness.notes.some((note) => 'stateNote' in note.body)).toBe(false);
  expect(pageState.versions[1].stateNote).toBeUndefined();
  expect(pageState.versions[0].questionsNote).toBe('q note');
}

async function validateNoNoteIsCopiedWhenTheQuestionsChanged() {
  const shown = buildVersion({ a: 1 }, QUESTIONS, 1, 't');
  shown.questionsNote = 'q note';
  const harness = installHarness([shown], 0, '[{"a":2}]', JSON.stringify({ other: { type: 'noul' } }), []);
  startBatchOn();
  await executeSubmitBatch();
  expect(harness.notes).toEqual([]);
}

async function validateKeptAndOverwrittenVersionsKeepTheirOwnNotesAndGetNoCopy() {
  const shown = buildVersion({ a: 1 }, QUESTIONS, 1, 't');
  shown.questionsNote = 'q note';
  const harness = installHarness([shown], 0, '[{"a":1}]', JSON.stringify(QUESTIONS), []);
  startBatchOn();
  await executeSubmitBatch();
  expect(harness.notes).toEqual([]);
  expect(pageState.versions[0].questionsNote).toBe('q note');
}

test('test_new_versions_get_the_shown_questions_note_when_questions_are_unchanged', validateNewVersionsGetTheShownQuestionsNoteWhenQuestionsAreUnchanged);
test('test_no_note_is_copied_when_the_questions_changed', validateNoNoteIsCopiedWhenTheQuestionsChanged);
test('test_kept_and_overwritten_versions_keep_their_own_notes_and_get_no_copy', validateKeptAndOverwrittenVersionsKeepTheirOwnNotesAndGetNoCopy);
