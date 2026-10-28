import { test, expect } from 'bun:test';
import type { Version } from '../playgroundHistory';
import { buildReportMarkdown } from './reportMarkdown';

function buildVersion(id: number, extra: Partial<Version>): Version {
  return { id, time: `t${id}`, state: {}, questions: {}, calls: 0, outputs: [], ...extra };
}

function validateNoVersionsGivesNoNotesYet() {
  expect(buildReportMarkdown([])).toBe('# Notes report\n\nNo notes yet.\n');
}

function validateVersionsWithoutNotesGiveNoNotesYet() {
  const versions = [buildVersion(1, {}), buildVersion(2, { note: '', stateNote: '' })];
  expect(buildReportMarkdown(versions)).toBe('# Notes report\n\nNo notes yet.\n');
}

function validateMixedSectionsAppearInOrder() {
  const versions = [buildVersion(1, { stateNote: 'about state', questionsNote: 'about questions', note: 'about the run' })];
  const expected = [
    '# Notes report',
    '## Version 1 (t1)',
    '### State notes',
    'about state',
    '### Questions notes',
    'about questions',
    '### Run comments',
    'about the run',
  ].join('\n\n') + '\n';
  expect(buildReportMarkdown(versions)).toBe(expected);
}

function validateVersionsWithoutNotesAreSkipped() {
  const versions = [buildVersion(1, {}), buildVersion(2, { note: 'second' }), buildVersion(3, {})];
  const markdown = buildReportMarkdown(versions);
  expect(markdown).toContain('## Version 2 (t2)');
  expect(markdown).not.toContain('Version 1');
  expect(markdown).not.toContain('Version 3');
}

function validateCopiedForwardStateAndQuestionsNotesAreSkipped() {
  const versions = [
    buildVersion(1, { stateNote: 'same', questionsNote: 'same q' }),
    buildVersion(2, { stateNote: 'same', questionsNote: 'same q' }),
    buildVersion(3, { stateNote: 'changed', questionsNote: 'same q', note: 'run' }),
  ];
  const markdown = buildReportMarkdown(versions);
  expect(markdown).not.toContain('Version 2');
  expect(markdown).toContain('## Version 3 (t3)\n\n### State notes\n\nchanged\n\n### Run comments');
  expect(markdown).not.toContain('Questions notes\n\nsame q\n\n### Run comments');
}

function validateResultNotesIncludeInstructionsAndWinnerLine() {
  const questions = { needsTask: { type: 'noul', instructions: 'Is it a task?', criteria: { true: 'a task', false: 'not a task' } } };
  const outputs = [{ answers: { needsTask: { type: 'noul', noul: 0.9 } } }] as never;
  const versions = [buildVersion(1, { questions, outputs, calls: 1, resultNotes: { needsTask: 'looks right', other: '' } })];
  const expected = [
    '# Notes report',
    '## Version 1 (t1)',
    '### Result notes',
    '#### needsTask',
    '> Is it a task?',
    'a task (1)',
    'looks right',
  ].join('\n\n') + '\n';
  expect(buildReportMarkdown(versions)).toBe(expected);
}

test('test_no_versions_gives_no_notes_yet', validateNoVersionsGivesNoNotesYet);
test('test_versions_without_notes_give_no_notes_yet', validateVersionsWithoutNotesGiveNoNotesYet);
test('test_mixed_sections_appear_in_order', validateMixedSectionsAppearInOrder);
test('test_versions_without_notes_are_skipped', validateVersionsWithoutNotesAreSkipped);
test('test_copied_forward_state_and_questions_notes_are_skipped', validateCopiedForwardStateAndQuestionsNotesAreSkipped);
test('test_result_notes_include_instructions_and_winner_line', validateResultNotesIncludeInstructionsAndWinnerLine);
