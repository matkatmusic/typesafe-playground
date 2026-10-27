import { test, expect } from 'bun:test';
import type { Answer } from './graphTypes';
import { formatWinnerLine, listWinnerGroups } from './winners';

const first: Answer = { type: 'choice', choice: 'a', confidence: 1, probabilities: { a: 0.9, b: 0.1 } };
const second: Answer = { type: 'choice', choice: 'b', confidence: 1, probabilities: { a: 0.1, b: 0.9 } };

function validateGroupsRunsByWinner() {
  const groups = listWinnerGroups([first, second, first]);
  expect(groups).toEqual([{ key: 'a', runs: [1, 3] }, { key: 'b', runs: [2] }]);
}

function validateNoGroupsForNoRuns() {
  expect(listWinnerGroups([])).toEqual([]);
}

function validateNoulGroupsAreYesAndNo() {
  const answers: Answer[] = [{ type: 'noul', noul: 0.9 }, { type: 'noul', noul: 0.1 }, { type: 'noul', noul: 0.7 }];
  expect(listWinnerGroups(answers)).toEqual([{ key: 'yes', runs: [1, 3] }, { key: 'no', runs: [2] }]);
}

function validateScoreGroupsUseTheProbabilities() {
  const legend = { 0: 'low', 1: 'high' };
  const low: Answer = { type: 'score', score: 0.3, confidence: 1, legend, probabilities: { 0: 0.7, 1: 0.3 } };
  const high: Answer = { type: 'score', score: 0.8, confidence: 1, legend, probabilities: { 0: 0.2, 1: 0.8 } };
  expect(listWinnerGroups([low, high])).toEqual([{ key: '0', runs: [1] }, { key: '1', runs: [2] }]);
}

function validateFormatWinnerLine() {
  const line = formatWinnerLine({ type: 'choice', criteria: { a: 'first' } }, { key: 'a', runs: [1, 3] });
  expect(line).toBe('first (1,3)');
}

function validateNoulLineShowsDescriptionAndRuns() {
  const question = { type: 'noul' as const, criteria: { true: 'is yes', false: 'is no' } };
  expect(formatWinnerLine(question, { key: 'yes', runs: [1, 3] })).toBe('is yes (1,3)');
  expect(formatWinnerLine(question, { key: 'no', runs: [2] })).toBe('is no (2)');
  expect(formatWinnerLine({ type: 'noul' }, { key: 'yes', runs: [1] })).toBe('(none) (1)');
}

test('test_winner_groups_collect_run_numbers', validateGroupsRunsByWinner);
test('test_no_runs_make_no_groups', validateNoGroupsForNoRuns);
test('test_noul_winner_groups_are_yes_and_no', validateNoulGroupsAreYesAndNo);
test('test_score_winner_groups_use_the_probabilities', validateScoreGroupsUseTheProbabilities);
test('test_winner_line_holds_description_and_runs', validateFormatWinnerLine);
test('test_noul_winner_line_shows_description_and_runs', validateNoulLineShowsDescriptionAndRuns);
