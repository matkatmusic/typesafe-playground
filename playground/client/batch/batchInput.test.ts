import { test, expect, afterEach, mock, describe } from 'bun:test';
import { pageState } from '../page/state';
import { executeSubmitBatch } from './submitBatch';
import { parseBatchInput } from './batchInput';
import { listQuestionsErrors } from '../../typesafe-checks/typesafeChecks';
import { getQuestions, buildVersion, installHarness, resetHarness, enableBatch } from './submitBatchHarness.test';

async function validateBadStateTextShowsTheErrorAndChangesNothing(stateText: string, expectedStart: string) {
    const harness = installHarness([buildVersion({ a: 1 }, getQuestions(), 1, 't')], 0, stateText, JSON.stringify(getQuestions()), []);
    enableBatch();
    harness.elements.errorLine.textContent = 'old error';
    await executeSubmitBatch();
    // Step: the error line shows the message, nothing was sent, and the toggle stays on.
    expect(harness.elements.errorLine.textContent.startsWith(expectedStart)).toBe(true);
    expect(harness.fetchOrder).toEqual([]);
    expect(pageState.isBatchOn).toBe(true);
    expect(pageState.versions.length).toBe(1);
    mock.restore();
}

async function validateEveryValidationErrorShowsAnErrorAndChangesNothing() {
    // Step: batch is on, the editor holds one bad state text at a time.
    const badStateTexts: [string, string][] = [
        ['{"a": ', 'state is not valid JSON'],
        ['{"a": 1}', 'state must be an array of objects while batch is on'],
        ['[]', 'the state array is empty: add at least one object'],
        ['[{"a": 1}, 5]', 'item 2 of the state array must be a JSON object'],
        ['[{"a": 1}, null]', 'item 2 of the state array must be a JSON object'],
        ['[[1]]', 'item 1 of the state array must be a JSON object'],
    ];
    for (const [stateText, expectedStart] of badStateTexts) {
        await validateBadStateTextShowsTheErrorAndChangesNothing(stateText, expectedStart);
    }
}

async function validateBadQuestionsShowTheTodayErrorAndChangeNothing() {
    const harness = installHarness([buildVersion({ a: 1 }, getQuestions(), 1, 't')], 0, '[{"a": 1}]', '{"q": ', []);
    enableBatch();
    await executeSubmitBatch();
    expect(harness.elements.errorLine.textContent.startsWith('questions is not valid JSON')).toBe(true);
    expect(harness.fetchOrder).toEqual([]);
    expect(pageState.isBatchOn).toBe(true);
}

async function validateQuestionsArrayShowsTheMessageAndSendsNothing() {
    const harness = installHarness([buildVersion({ a: 1 }, getQuestions(), 1, 't')], 0, '[{"a": 1}]', '[]', []);
    enableBatch();
    await executeSubmitBatch();
    expect(harness.elements.errorLine.textContent).toBe('questions must be a JSON object');
    expect(harness.fetchOrder).toEqual([]);
    expect(pageState.isBatchOn).toBe(true);
    expect(pageState.versions.length).toBe(1);
}

async function validateItemWithoutAUsedNameShowsTheItemErrorAndSendsNothing() {
    // Step: the question uses `tone`; item 1 has it, item 2 does not.
    const questionsText = '{"q":{"type":"noul","instructions":"Is `tone` calm?"}}';
    const harness = installHarness([buildVersion({ a: 1 }, getQuestions(), 1, 't')], 0, '[{"tone":"calm"},{"a":1}]', questionsText, []);
    enableBatch();
    await executeSubmitBatch();
    // Step: the error line names item 2, nothing was sent, and no version was added.
    expect(harness.elements.errorLine.textContent).toBe('item 2: q: `tone` is not in state or in this question');
    expect(harness.fetchOrder).toEqual([]);
    expect(harness.locks).toEqual([]);
    expect(pageState.versions.length).toBe(1);
}

async function validateQuestionShapeErrorShowsOnceForTheWholeBatch() {
    // Step: two batch items share questions with a wrong type.
    const questionsText = '{"q":{"type":"wrong"}}';
    const harness = installHarness([buildVersion({ a: 1 }, getQuestions(), 1, 't')], 0, '[{"a":1},{"a":2}]', questionsText, []);
    enableBatch();
    await executeSubmitBatch();
    // Step: the error line holds the shape error once, with no item prefix.
    expect(harness.elements.errorLine.textContent).toBe(listQuestionsErrors(JSON.parse(questionsText)).join('; '));
    expect(harness.fetchOrder).toEqual([]);
}

function validateParseBatchInputReturnsTheStatesAndQuestionsWhenInputIsValid() {
    // Step: the editors hold two valid states and valid questions.
    installHarness([buildVersion({ a: 1 }, getQuestions(), 1, 't')], 0, '[{"a":1},{"a":2}]', JSON.stringify(getQuestions()), []);
    // Step: parsing returns both states and the questions.
    expect(parseBatchInput()).toEqual({ isValid: true, states: [{ a: 1 }, { a: 2 }], questions: getQuestions() });
}

function registerBatchInputTests() {
    afterEach(resetHarness);
    test('test_every_validation_error_shows_an_error_and_changes_nothing', validateEveryValidationErrorShowsAnErrorAndChangesNothing);
    test('test_bad_questions_show_the_today_error_and_change_nothing', validateBadQuestionsShowTheTodayErrorAndChangeNothing);
    test('test_questions_array_shows_the_message_and_sends_nothing', validateQuestionsArrayShowsTheMessageAndSendsNothing);
    test('test_item_without_a_used_name_shows_the_item_error_and_sends_nothing', validateItemWithoutAUsedNameShowsTheItemErrorAndSendsNothing);
    test('test_question_shape_error_shows_once_for_the_whole_batch', validateQuestionShapeErrorShowsOnceForTheWholeBatch);
    test('test_parse_batch_input_returns_the_states_and_questions_when_input_is_valid', validateParseBatchInputReturnsTheStatesAndQuestionsWhenInputIsValid);
}

describe('batch input', registerBatchInputTests);
