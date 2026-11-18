import { test, expect } from 'bun:test';
import type { Answer } from '../graphs/graphTypes';
import { buildBarInfoRows } from './infoRows';
import { getNoulQuestion, getNoulAnswers } from './infoRowsFixtures';

function validateNoulCallRowsDoNotThrow() {
    const noulQuestion = getNoulQuestion();
    const noulAnswers = getNoulAnswers();
    const callRows = buildBarInfoRows({ question: noulQuestion, answers: noulAnswers, key: 'yes', keys: ['yes'], callIndex: 0, pinned: null });
    expect(callRows[0].parts[0][0]).toBe('yes');
    expect(callRows[1].parts.length).toBe(1);
    expect(callRows[1].parts[0][0]).toBe('0.800');
    expect(callRows[2].parts[1][0]).toBe('0.300');
    expect(callRows[2].parts[3][0]).toBe('0.800');
    expect(callRows[3].parts[0][0]).toBe('1');
    expect(callRows[3].parts[2][0]).toBe('2');
    expect(callRows[4].parts[0][0]).toBe('is yes');
}

function validateNoulAverageRowsDoNotThrow() {
    const noulQuestion = getNoulQuestion();
    const noulAnswers = getNoulAnswers();
    const averageRows = buildBarInfoRows({ question: noulQuestion, answers: noulAnswers, key: 'yes', keys: ['yes'], callIndex: -1, pinned: null });
    expect(averageRows[1].parts[0][0]).toBe('0.550');
}

function validateNoulBlankRowsDoNotThrow() {
    const noulQuestion = getNoulQuestion();
    const noulAnswers = getNoulAnswers();
    const blankRows = buildBarInfoRows({ question: noulQuestion, answers: noulAnswers, key: '', keys: ['yes'], callIndex: null, pinned: null });
    expect(blankRows.length).toBe(4);
    expect(blankRows[1].parts.length).toBe(1);
}

function validateLowNoulShowsTheNoChoice() {
    const noulQuestion = getNoulQuestion();
    const lowAnswers: Answer[] = [{ type: 'noul', noul: 0.07 }];
    for (const callIndex of [0, -1]) {
        const rows = buildBarInfoRows({ question: noulQuestion, answers: lowAnswers, key: 'yes', keys: ['yes'], callIndex, pinned: null });
        expect(rows[0].parts[0][0]).toBe('no');
        expect(rows[1].parts[0][0]).toBe('0.070');
        expect(rows[3].parts[0][0]).toBe('1');
        expect(rows[4].parts[0][0]).toBe('is no');
    }
}

test('test_noul_bar_info_has_no_confidence_and_does_not_throw', validateNoulCallRowsDoNotThrow);
test('test_noul_average_bar_info_does_not_throw', validateNoulAverageRowsDoNotThrow);
test('test_noul_blank_bar_info_does_not_throw', validateNoulBlankRowsDoNotThrow);
test('test_low_noul_shows_the_no_choice', validateLowNoulShowsTheNoChoice);
