import { test, expect } from 'bun:test';
import type { Question } from '@typesafe-ai/sdk';
import type { Answer } from '../graphs/graphTypes';
import { buildBarInfoRows } from './infoRows';
import { getChoiceQuestion, getChoiceAnswers } from './infoRowsFixtures';

function validateBlankRowsHaveNoValues() {
    const question = getChoiceQuestion();
    const answers = getChoiceAnswers();
    const rows = buildBarInfoRows({ question, answers, key: '', keys: ['a', 'b'], callIndex: null, pinned: null });
    expect(rows.length).toBe(4);
    expect(rows[0].parts[0][0]).toBe('');
}

function validateCallRowsHoldTheCallValues() {
    const question = getChoiceQuestion();
    const answers = getChoiceAnswers();
    const rows = buildBarInfoRows({ question, answers, key: 'a', keys: ['a', 'b'], callIndex: 1, pinned: null });
    expect(rows.length).toBe(5);
    expect(rows[0].parts[0][0]).toBe('a');
    expect(rows[1].parts[0][0]).toBe('0.200');
    expect(rows[1].parts[2][0]).toBe('0.700');
    expect(rows[2].parts[1][0]).toBe('0.200');
    expect(rows[3].parts[0][0]).toBe('1');
    expect(rows[4].parts[0][0]).toBe('first');
}

function validateAverageRowsHoldTheAverages() {
    const question = getChoiceQuestion();
    const answers = getChoiceAnswers();
    const rows = buildBarInfoRows({ question, answers, key: 'a', keys: ['a', 'b'], callIndex: -1, pinned: null });
    expect(rows[1].parts[0][0]).toBe('0.400');
    expect(rows[1].parts[2][0]).toBe('0.600');
}

function validateScoreTopRunsUseTheProbabilities() {
    const scoreQuestion: Question = { type: 'score', criteria: ['low', 'high'] };
    const scoreAnswers: Answer[] = [
        { type: 'score', score: 0.8, confidence: 0.5, legend: { 0: 'low', 1: 'high' }, probabilities: { 0: 0.2, 1: 0.8 } },
        { type: 'score', score: 0.3, confidence: 0.5, legend: { 0: 'low', 1: 'high' }, probabilities: { 0: 0.7, 1: 0.3 } },
    ];
    const rows = buildBarInfoRows({ question: scoreQuestion, answers: scoreAnswers, key: '1', keys: ['0', '1'], callIndex: 0, pinned: null });
    expect(rows[3].parts[0][0]).toBe('1');
    expect(rows[4].parts[0][0]).toBe('high');
}

test('test_blank_bar_info_has_blank_values', validateBlankRowsHaveNoValues);
test('test_call_bar_info_holds_score_and_confidence', validateCallRowsHoldTheCallValues);
test('test_average_bar_info_holds_averages', validateAverageRowsHoldTheAverages);
test('test_score_top_runs_use_the_probabilities', validateScoreTopRunsUseTheProbabilities);
