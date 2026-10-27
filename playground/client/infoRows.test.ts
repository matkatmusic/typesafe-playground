import { test, expect } from 'bun:test';
import type { Question } from '@typesafe-ai/sdk';
import type { Answer } from './graphTypes';
import { buildBarInfoRows } from './infoRows';

const question: Question = { type: 'choice', criteria: { a: 'first', b: 'second' } };
const answers: Answer[] = [
  { type: 'choice', choice: 'a', confidence: 0.5, probabilities: { a: 0.6, b: 0.4 } },
  { type: 'choice', choice: 'b', confidence: 0.7, probabilities: { a: 0.2, b: 0.8 } },
];
const noulQuestion: Question = { type: 'noul', criteria: { true: 'is yes', false: 'is no' } };
const noulAnswers: Answer[] = [{ type: 'noul', noul: 0.8 }, { type: 'noul', noul: 0.3 }];

function validateBlankRowsHaveNoValues() {
  const rows = buildBarInfoRows({ question, answers, key: '', keys: ['a', 'b'], callIndex: null });
  expect(rows.length).toBe(4);
  expect(rows[0].parts[0][0]).toBe('');
}

function validateCallRowsHoldTheCallValues() {
  const rows = buildBarInfoRows({ question, answers, key: 'a', keys: ['a', 'b'], callIndex: 1 });
  expect(rows.length).toBe(5);
  expect(rows[0].parts[0][0]).toBe('a');
  expect(rows[1].parts[0][0]).toBe('0.200');
  expect(rows[1].parts[2][0]).toBe('0.700');
  expect(rows[2].parts[1][0]).toBe('0.200');
  expect(rows[3].parts[0][0]).toBe('1');
  expect(rows[4].parts[0][0]).toBe('first');
}

function validateAverageRowsHoldTheAverages() {
  const rows = buildBarInfoRows({ question, answers, key: 'a', keys: ['a', 'b'], callIndex: -1 });
  expect(rows[1].parts[0][0]).toBe('0.400');
  expect(rows[1].parts[2][0]).toBe('0.600');
}

function validateNoulRowsDoNotThrow() {
  const callRows = buildBarInfoRows({ question: noulQuestion, answers: noulAnswers, key: 'yes', keys: ['yes'], callIndex: 0 });
  expect(callRows[0].parts[0][0]).toBe('yes');
  expect(callRows[1].parts.length).toBe(1);
  expect(callRows[1].parts[0][0]).toBe('0.800');
  expect(callRows[2].parts[1][0]).toBe('0.300');
  expect(callRows[2].parts[3][0]).toBe('0.800');
  expect(callRows[3].parts[0][0]).toBe('1');
  expect(callRows[3].parts[2][0]).toBe('2');
  expect(callRows[4].parts[0][0]).toBe('is yes');
  const averageRows = buildBarInfoRows({ question: noulQuestion, answers: noulAnswers, key: 'yes', keys: ['yes'], callIndex: -1 });
  expect(averageRows[1].parts[0][0]).toBe('0.550');
  const blankRows = buildBarInfoRows({ question: noulQuestion, answers: noulAnswers, key: '', keys: ['yes'], callIndex: null });
  expect(blankRows.length).toBe(4);
  expect(blankRows[1].parts.length).toBe(1);
}

function validateScoreTopRunsUseTheProbabilities() {
  const scoreQuestion: Question = { type: 'score', criteria: ['low', 'high'] };
  const scoreAnswers: Answer[] = [
    { type: 'score', score: 0.8, confidence: 0.5, legend: { 0: 'low', 1: 'high' }, probabilities: { 0: 0.2, 1: 0.8 } },
    { type: 'score', score: 0.3, confidence: 0.5, legend: { 0: 'low', 1: 'high' }, probabilities: { 0: 0.7, 1: 0.3 } },
  ];
  const rows = buildBarInfoRows({ question: scoreQuestion, answers: scoreAnswers, key: '1', keys: ['0', '1'], callIndex: 0 });
  expect(rows[3].parts[0][0]).toBe('1');
  expect(rows[4].parts[0][0]).toBe('high');
}

test('test_blank_bar_info_has_blank_values', validateBlankRowsHaveNoValues);
test('test_call_bar_info_holds_score_and_confidence', validateCallRowsHoldTheCallValues);
test('test_average_bar_info_holds_averages', validateAverageRowsHoldTheAverages);
test('test_noul_bar_info_has_no_confidence_and_does_not_throw', validateNoulRowsDoNotThrow);
test('test_score_top_runs_use_the_probabilities', validateScoreTopRunsUseTheProbabilities);
