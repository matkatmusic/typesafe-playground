import { test, expect } from 'bun:test';
import type { Version } from '../playgroundHistory';
import type { Answer } from './graphTypes';
import { computeSummary, formatValueText, listAnswers, listOptionKeys, listValues, NOUL_KEY, readQuestions, readValue } from './graphValues';

const choiceAnswer: Answer = { type: 'choice', choice: 'a', confidence: 0.9, probabilities: { a: 0.7, b: 0.3 } };
const noulAnswer: Answer = { type: 'noul', noul: 0.8 };
const scoreAnswer: Answer = { type: 'score', score: 1.4, confidence: 0.5, legend: { 0: 'low', 1: 'high' }, probabilities: { 0: 0.2, 1: 0.8 } };
const usage = { input_tokens: 1, output_tokens: 1 };

function buildVersion(questions: unknown): Version {
  return { id: 1, time: 'now', state: null, questions, calls: 1, outputs: [{ model: 'm', answers: { q: noulAnswer }, usage }] };
}

function validateFormatValueText() {
  expect(formatValueText(undefined)).toBe('(none)');
  expect(formatValueText(null)).toBe('(none)');
  expect(formatValueText('text')).toBe('text');
  expect(formatValueText({ a: 1 })).toBe('{"a":1}');
}

function validateNoulIsOneYesOptionAtTheNoulValue() {
  expect(NOUL_KEY).toBe('yes');
  expect(listOptionKeys(noulAnswer)).toEqual(['yes']);
  expect(readValue(noulAnswer, 'yes')).toBe(0.8);
  expect(listValues([noulAnswer, noulAnswer], 'yes')).toEqual([0.8, 0.8]);
}

function validateBadKeysThrow() {
  function readNoulNo() {
    return readValue(noulAnswer, 'no');
  }
  function readChoiceMissing() {
    return readValue(choiceAnswer, 'zzz');
  }
  expect(readNoulNo).toThrow();
  expect(readChoiceMissing).toThrow();
}

function validateChoiceAndScoreValues() {
  expect(listOptionKeys(choiceAnswer)).toEqual(['a', 'b']);
  expect(listOptionKeys(scoreAnswer)).toEqual(['0', '1']);
  expect(readValue(choiceAnswer, 'b')).toBe(0.3);
  expect(readValue(scoreAnswer, '1')).toBe(0.8);
}

function validateComputeSummary() {
  const summary = computeSummary([0.2, 0.8, 0.5]);
  expect(summary.low).toBe(0.2);
  expect(summary.high).toBe(0.8);
  expect(summary.average).toBeCloseTo(0.5);
}

function validateListAnswersReadsOneNamePerOutput() {
  expect(listAnswers(buildVersion({}), 'q')).toEqual([noulAnswer]);
}

function validateReadQuestionsRejectsNonObjects() {
  const questions = { q: { type: 'noul' as const } };
  expect(readQuestions(buildVersion(questions))).toBe(questions);
  function readNull() {
    return readQuestions(buildVersion(null));
  }
  function readArray() {
    return readQuestions(buildVersion([]));
  }
  expect(readNull).toThrow();
  expect(readArray).toThrow();
}

test('test_format_value_text_handles_missing_text_and_json', validateFormatValueText);
test('test_noul_is_one_yes_option_at_the_noul_value', validateNoulIsOneYesOptionAtTheNoulValue);
test('test_noul_other_key_and_missing_choice_key_throw', validateBadKeysThrow);
test('test_choice_and_score_values_come_from_probabilities', validateChoiceAndScoreValues);
test('test_compute_summary_finds_low_high_average', validateComputeSummary);
test('test_list_answers_reads_one_name_per_output', validateListAnswersReadsOneNamePerOutput);
test('test_read_questions_rejects_non_objects', validateReadQuestionsRejectsNonObjects);
