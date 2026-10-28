import { test, expect } from 'bun:test';
import type { Version } from '../playgroundHistory';
import { buildReportMarkdown } from './reportMarkdown';

function buildVersion(id: number, extra: Partial<Version>): Version {
  return { id, time: `t${id}`, state: {}, questions: {}, calls: 0, outputs: [], ...extra };
}

function validateNoVersionsGivesNoNotesYet() {
  expect(buildReportMarkdown([])).toBe('# Notes report\n\nNo notes or runs yet.\n');
}

function validateVersionsWithoutNotesGiveNoNotesYet() {
  const versions = [buildVersion(1, {}), buildVersion(2, { note: '', stateNote: '' })];
  expect(buildReportMarkdown(versions)).toBe('# Notes report\n\nNo notes or runs yet.\n');
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

const taskQuestions = { needsTask: { type: 'noul', instructions: 'Is it a task?', criteria: { true: 'a task', false: 'not a task' } } };

function buildTaskOutputs(noul: number) {
  return [{ answers: { needsTask: { type: 'noul', noul: noul } } }] as never;
}

// function validateResultNotesIncludeInstructionsAndWinnerLine() {
//   const questions = { needsTask: { type: 'noul', instructions: 'Is it a task?', criteria: { true: 'a task', false: 'not a task' } } };
//   const outputs = [{ answers: { needsTask: { type: 'noul', noul: 0.9 } } }] as never;
//   const versions = [buildVersion(1, { questions, outputs, calls: 1, resultNotes: { needsTask: 'looks right', other: '' } })];
//   const expected = [
//     '# Notes report',
//     '## Version 1 (t1)',
//     '### Result notes',
//     '#### needsTask',
//     '> Is it a task?',
//     'a task (1)',
//     'looks right',
//   ].join('\n\n') + '\n';
//   expect(buildReportMarkdown(versions)).toBe(expected);
// }

function validateResultsIncludeInstructionsMetricLineAndNote() {
  const versions = [buildVersion(1, { questions: taskQuestions, outputs: buildTaskOutputs(0.9), calls: 1, resultNotes: { needsTask: 'looks right', other: '' } })];
  const expected = [
    '# Notes report',
    '## Version 1 (t1)',
    '### Results',
    '#### needsTask',
    '> Is it a task?',
    'Winner: a task (1) · avg 0.900',
    'looks right',
  ].join('\n\n') + '\n';
  expect(buildReportMarkdown(versions)).toBe(expected);
}

function validateVersionWithRunsButNoNotesAppears() {
  const versions = [buildVersion(1, { questions: taskQuestions, outputs: buildTaskOutputs(0.9), calls: 1 })];
  const markdown = buildReportMarkdown(versions);
  expect(markdown).toContain('## Version 1 (t1)\n\n### Results\n\n#### needsTask\n\n> Is it a task?\n\nWinner: a task (1) · avg 0.900\n');
}

function validateResultNoteWithoutRunsShowsNoRunsInsteadOfThrowing() {
  const versions = [buildVersion(1, { questions: taskQuestions, resultNotes: { needsTask: 'old note' } })];
  const expected = ['# Notes report', '## Version 1 (t1)', '### Results', '#### needsTask', '(no runs)', 'old note'].join('\n\n') + '\n';
  expect(buildReportMarkdown(versions)).toBe(expected);
}

function validateChangesAppearBeforeNotesAndResults() {
  const first = buildVersion(1, { state: { a: 1 }, questions: taskQuestions, outputs: buildTaskOutputs(0.5), calls: 1 });
  const second = buildVersion(2, { state: { a: 1, b: 2 }, questions: taskQuestions, outputs: buildTaskOutputs(0.8), calls: 1, note: 'ran again' });
  const markdown = buildReportMarkdown([first, second]);
  expect(markdown).not.toMatch(/Version 1[^#]*### Changes/);
  expect(markdown).toContain('## Version 2 (t2)\n\n### Changes\n\n- state: `b` added\n\n### Run comments\n\nran again\n\n### Results');
  expect(markdown).toContain('Winner: a task (1) · avg 0.800 · ▲ 0.300');
}

function validateVersionsAreListedNewestFirst() {
  const versions = [
    buildVersion(1, { state: { a: 1 }, note: 'one' }),
    buildVersion(2, { state: { a: 1, b: 2 }, note: 'two' }),
    buildVersion(3, { state: { a: 1, b: 2, c: 3 }, note: 'three' }),
  ];
  const markdown = buildReportMarkdown(versions);
  const versionThree = markdown.indexOf('## Version 3');
  const versionTwo = markdown.indexOf('## Version 2');
  const versionOne = markdown.indexOf('## Version 1');
  expect(versionThree).toBeGreaterThan(-1);
  expect(versionThree).toBeLessThan(versionTwo);
  expect(versionTwo).toBeLessThan(versionOne);
  expect(markdown).toContain('## Version 2 (t2)\n\n### Changes\n\n- state: `b` added\n');
}

test('test_no_versions_gives_no_notes_yet', validateNoVersionsGivesNoNotesYet);
test('test_versions_without_notes_give_no_notes_yet', validateVersionsWithoutNotesGiveNoNotesYet);
test('test_mixed_sections_appear_in_order', validateMixedSectionsAppearInOrder);
test('test_versions_without_notes_are_skipped', validateVersionsWithoutNotesAreSkipped);
test('test_copied_forward_state_and_questions_notes_are_skipped', validateCopiedForwardStateAndQuestionsNotesAreSkipped);
// test('test_result_notes_include_instructions_and_winner_line', validateResultNotesIncludeInstructionsAndWinnerLine);
test('test_results_include_instructions_metric_line_and_note', validateResultsIncludeInstructionsMetricLineAndNote);
test('test_version_with_runs_but_no_notes_appears', validateVersionWithRunsButNoNotesAppears);
test('test_result_note_without_runs_shows_no_runs_instead_of_throwing', validateResultNoteWithoutRunsShowsNoRunsInsteadOfThrowing);
test('test_changes_appear_before_notes_and_results', validateChangesAppearBeforeNotesAndResults);
test('test_versions_are_listed_newest_first', validateVersionsAreListedNewestFirst);
