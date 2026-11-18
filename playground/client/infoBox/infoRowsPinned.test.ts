import { test, expect } from 'bun:test';
import type { Question } from '@typesafe-ai/sdk';
import { graphState } from '../graphs/graphState';
import { buildBarInfoRows } from './infoRows';
import { pageState } from '../page/state';
import { getChoiceQuestion, getChoiceAnswers } from './infoRowsFixtures';

function validatePinnedRowHoldsTheMinMaxAndAverageOfThePin() {
    const question = getChoiceQuestion();
    const answers = getChoiceAnswers();
    const request = { question, answers, key: 'a', keys: ['a', 'b'], callIndex: 1, pinned: { values: [0.1, 0.3] } };
    pageState.pinnedIndex = 3;
    const rows = buildBarInfoRows(request);
    pageState.pinnedIndex = null;
    expect(rows.length).toBe(6);
    expect(rows[4].label).toBe('Pinned v4:');
    expect(rows[4].parts[1][0]).toBe('0.100');
    expect(rows[4].parts[3][0]).toBe('0.300');
    expect(rows[4].parts[5][0]).toBe('0.200');
    expect(rows[5].label).toBe('Message:');
}

function validateBlankRowsKeepNoPinnedRow() {
    const question = getChoiceQuestion();
    const answers = getChoiceAnswers();
    const rows = buildBarInfoRows({ question, answers, key: '', keys: ['a', 'b'], callIndex: null, pinned: { values: [] } });
    expect(rows.length).toBe(4);
}

function validateMessageRowReplacesReferencesOnlyWhenTicked() {
    const referenceQuestion: Question = { type: 'choice', criteria: { a: '`message.text` here', b: 'second' } };
    const version = { time: '', state: { message: { text: 'Hi' } }, questions: {}, calls: 0, outputs: [] };
    pageState.versions = [version];
    pageState.index = 0;
    const request = { question: referenceQuestion, answers: getChoiceAnswers(), key: 'a', keys: ['a', 'b'], callIndex: 1, pinned: null };
    graphState.isReferencesReplaced = true;
    const replacedRows = buildBarInfoRows(request);
    graphState.isReferencesReplaced = false;
    const keptRows = buildBarInfoRows(request);
    pageState.versions = [];
    pageState.index = 0;
    expect(replacedRows[4].parts[0][0]).toBe("'Hi' here");
    expect(keptRows[4].parts[0][0]).toBe('`message.text` here');
}

test('test_message_row_replaces_references_only_when_ticked', validateMessageRowReplacesReferencesOnlyWhenTicked);
test('test_pinned_row_holds_the_min_max_and_average_of_the_pin', validatePinnedRowHoldsTheMinMaxAndAverageOfThePin);
test('test_blank_bar_info_keeps_no_pinned_row', validateBlankRowsKeepNoPinnedRow);
