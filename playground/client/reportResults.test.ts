import { test, expect } from 'bun:test';
import type { Version } from '../playgroundHistory';
import { listResultBlocks } from './reportResults';

const questions = {
  yesNo: { type: 'noul', instructions: 'Is it?', criteria: { true: 'yes it is', false: 'no it is not' } },
  pick: { type: 'choice', instructions: 'Which?', criteria: { a: 'option a', b: 'option b' } },
  grade: { type: 'score', instructions: 'How good?', criteria: ['bad', 'good'] },
};

function buildAnswers(noul: number, probabilities: Record<string, number>, grades: Record<string, number>) {
  const top = probabilities.a >= probabilities.b ? 'a' : 'b';
  return {
    yesNo: { type: 'noul', noul: noul },
    pick: { type: 'choice', choice: top, confidence: 1, probabilities: probabilities },
    grade: { type: 'score', score: 1, confidence: 1, legend: {}, probabilities: grades },
  };
}

function buildVersion(id: number, answerSets: ReturnType<typeof buildAnswers>[], extra: Partial<Version>): Version {
  const outputs = [];
  for (const answers of answerSets)
    outputs.push({ answers: answers });
  return { id: id, time: `t${id}`, state: {}, questions: questions, calls: outputs.length, outputs: outputs as never, ...extra };
}

function pickMetricLine(blocks: string[], name: string): string {
  const headingIndex = blocks.indexOf(`#### ${name}`);
  return blocks[headingIndex + 2];
}

function validateNoulMetricUsesTheNoulAverage() {
  const versions = [buildVersion(1, [buildAnswers(0.9, { a: 0.6, b: 0.4 }, { 0: 0.3, 1: 0.7 }), buildAnswers(0.7, { a: 0.6, b: 0.4 }, { 0: 0.3, 1: 0.7 })], {})];
  expect(pickMetricLine(listResultBlocks(versions, 0), 'yesNo')).toBe('Winner: yes it is (1,2) · avg 0.800');
}

function validateChoiceMetricUsesTheWinningProbabilityAverage() {
  const versions = [buildVersion(1, [buildAnswers(0.9, { a: 0.6, b: 0.4 }, { 0: 0.3, 1: 0.7 }), buildAnswers(0.9, { a: 0.8, b: 0.2 }, { 0: 0.3, 1: 0.7 })], {})];
  expect(pickMetricLine(listResultBlocks(versions, 0), 'pick')).toBe('Winner: option a (1,2) · avg 0.700');
}

function validateScoreMetricUsesTheWinningProbabilityAverage() {
  const versions = [buildVersion(1, [buildAnswers(0.9, { a: 0.6, b: 0.4 }, { 0: 0.3, 1: 0.7 })], {})];
  expect(pickMetricLine(listResultBlocks(versions, 0), 'grade')).toBe('Winner: good (1) · avg 0.700');
}

function validateMostVotedGroupWins() {
  const answerSets = [
    buildAnswers(0.9, { a: 0.2, b: 0.8 }, { 0: 0.3, 1: 0.7 }),
    buildAnswers(0.9, { a: 0.9, b: 0.1 }, { 0: 0.3, 1: 0.7 }),
    buildAnswers(0.9, { a: 0.3, b: 0.7 }, { 0: 0.3, 1: 0.7 }),
  ];
  expect(pickMetricLine(listResultBlocks([buildVersion(1, answerSets, {})], 0), 'pick')).toBe('Winner: option b (1,3) · avg 0.533');
}

function validateHigherAverageShowsUpArrow() {
  const first = buildVersion(1, [buildAnswers(0.5, { a: 0.6, b: 0.4 }, { 0: 0.3, 1: 0.7 })], {});
  const second = buildVersion(2, [buildAnswers(0.62, { a: 0.6, b: 0.4 }, { 0: 0.3, 1: 0.7 })], {});
  expect(pickMetricLine(listResultBlocks([first, second], 1), 'yesNo')).toBe('Winner: yes it is (1) · avg 0.620 · ▲ 0.120');
}

function validateLowerAverageShowsDownArrow() {
  const first = buildVersion(1, [buildAnswers(0.9, { a: 0.6, b: 0.4 }, { 0: 0.3, 1: 0.7 })], {});
  const second = buildVersion(2, [buildAnswers(0.85, { a: 0.6, b: 0.4 }, { 0: 0.3, 1: 0.7 })], {});
  expect(pickMetricLine(listResultBlocks([first, second], 1), 'yesNo')).toBe('Winner: yes it is (1) · avg 0.850 · ▼ 0.050');
}

function validateSameAverageShowsNoChange() {
  const first = buildVersion(1, [buildAnswers(0.9, { a: 0.6, b: 0.4 }, { 0: 0.3, 1: 0.7 })], {});
  const second = buildVersion(2, [buildAnswers(0.9, { a: 0.6, b: 0.4 }, { 0: 0.3, 1: 0.7 })], {});
  expect(pickMetricLine(listResultBlocks([first, second], 1), 'yesNo')).toBe('Winner: yes it is (1) · avg 0.900 · no change');
}

function validateDifferentWinnerNamesTheOldKey() {
  const first = buildVersion(1, [buildAnswers(0.9, { a: 0.6, b: 0.4 }, { 0: 0.3, 1: 0.7 })], {});
  const second = buildVersion(2, [buildAnswers(0.9, { a: 0.3, b: 0.7 }, { 0: 0.3, 1: 0.7 })], {});
  expect(pickMetricLine(listResultBlocks([first, second], 1), 'pick')).toBe('Winner: option b (1) · avg 0.700 · winner was a');
}

function validateComparisonSkipsVersionsWithoutRuns() {
  const first = buildVersion(1, [buildAnswers(0.5, { a: 0.6, b: 0.4 }, { 0: 0.3, 1: 0.7 })], {});
  const middle = buildVersion(2, [], {});
  const last = buildVersion(3, [buildAnswers(0.6, { a: 0.6, b: 0.4 }, { 0: 0.3, 1: 0.7 })], {});
  expect(pickMetricLine(listResultBlocks([first, middle, last], 2), 'yesNo')).toBe('Winner: yes it is (1) · avg 0.600 · ▲ 0.100');
}

function validateFirstRunHasNoChangeText() {
  const versions = [buildVersion(1, [buildAnswers(0.9, { a: 0.6, b: 0.4 }, { 0: 0.3, 1: 0.7 })], {})];
  expect(pickMetricLine(listResultBlocks(versions, 0), 'yesNo')).not.toContain('▲');
}

function validateNoteWithoutRunsShowsNoRuns() {
  const versions = [buildVersion(1, [], { resultNotes: { yesNo: 'kept note', pick: '' } })];
  expect(listResultBlocks(versions, 0)).toEqual(['### Results', '#### yesNo', '(no runs)', 'kept note']);
}

function validateNoRunsAndNoNotesGiveNoBlocks() {
  expect(listResultBlocks([buildVersion(1, [], {})], 0)).toEqual([]);
}

test('test_noul_metric_uses_the_noul_average', validateNoulMetricUsesTheNoulAverage);
test('test_choice_metric_uses_the_winning_probability_average', validateChoiceMetricUsesTheWinningProbabilityAverage);
test('test_score_metric_uses_the_winning_probability_average', validateScoreMetricUsesTheWinningProbabilityAverage);
test('test_most_voted_group_wins', validateMostVotedGroupWins);
test('test_higher_average_shows_up_arrow', validateHigherAverageShowsUpArrow);
test('test_lower_average_shows_down_arrow', validateLowerAverageShowsDownArrow);
test('test_same_average_shows_no_change', validateSameAverageShowsNoChange);
test('test_different_winner_names_the_old_key', validateDifferentWinnerNamesTheOldKey);
test('test_comparison_skips_versions_without_runs', validateComparisonSkipsVersionsWithoutRuns);
test('test_first_run_has_no_change_text', validateFirstRunHasNoChangeText);
test('test_note_without_runs_shows_no_runs', validateNoteWithoutRunsShowsNoRuns);
test('test_no_runs_and_no_notes_give_no_blocks', validateNoRunsAndNoNotesGiveNoBlocks);
