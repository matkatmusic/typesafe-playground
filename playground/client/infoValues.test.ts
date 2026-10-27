import { test, expect } from 'bun:test';
import type { Answer } from './graphTypes';
import { NOUL_NO_KEY, readConfidence, readDescription, readTopKey } from './infoValues';

const scoreAnswer: Answer = { type: 'score', score: 0.8, confidence: 0.5, legend: { 0: 'low', 1: 'high' }, probabilities: { 0: 0.2, 1: 0.8 } };

function validateReadConfidence() {
  expect(readConfidence({ type: 'choice', choice: 'a', confidence: 0.9, probabilities: { a: 1 } })).toBe(0.9);
  expect(readConfidence(scoreAnswer)).toBe(0.5);
  function readNoulConfidence() {
    return readConfidence({ type: 'noul', noul: 0.5 });
  }
  expect(readNoulConfidence).toThrow();
}

function validateReadTopKey() {
  expect(readTopKey({ type: 'choice', choice: 'b', confidence: 1, probabilities: { a: 0.9, b: 0.1 } }, ['a', 'b'])).toBe('b');
  expect(readTopKey(scoreAnswer, ['0', '1'])).toBe('1');
  expect(NOUL_NO_KEY).toBe('no');
  expect(readTopKey({ type: 'noul', noul: 0.8 }, ['yes'])).toBe('yes');
  expect(readTopKey({ type: 'noul', noul: 0.2 }, ['yes'])).toBe('no');
  expect(readTopKey({ type: 'noul', noul: 0.5 }, ['yes'])).toBe('no');
}

function validateReadDescription() {
  expect(readDescription({ type: 'noul', criteria: { true: 'is yes', false: 'is no' } }, 'yes')).toBe('is yes');
  expect(readDescription({ type: 'noul', criteria: { true: 'is yes', false: 'is no' } }, 'no')).toBe('is no');
  expect(readDescription({ type: 'noul' }, 'yes')).toBe('(none)');
  expect(readDescription({ type: 'noul', criteria: null }, 'yes')).toBe('(none)');
  expect(readDescription({ type: 'choice', criteria: { a: null } }, 'a')).toBe('(none)');
  expect(readDescription({ type: 'choice', criteria: { a: 'first' } }, 'a')).toBe('first');
  expect(readDescription({ type: 'score', criteria: ['low', 'high'] }, '1')).toBe('high');
}

test('test_read_confidence_throws_for_noul', validateReadConfidence);
test('test_read_top_key_handles_choice_score_and_noul', validateReadTopKey);
test('test_read_description_handles_each_question_type', validateReadDescription);
