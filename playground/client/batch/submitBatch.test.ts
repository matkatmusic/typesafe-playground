import { test, expect, afterEach, describe } from 'bun:test';
import { executeSubmitForMode } from './submitBatch';
import { getQuestions, buildVersion, installHarness, resetHarness, enableBatch } from './submitBatchHarness.test';

async function validateDispatcherSendsBatchOnToTheBatchSubmit() {
    const harness = installHarness([buildVersion({ a: 0 }, getQuestions(), 1, 't')], 0, '[{"a":1}]', JSON.stringify(getQuestions()), []);
    enableBatch();
    await executeSubmitForMode();
    expect(harness.runs.length).toBe(1);
}

async function validateDispatcherSendsBatchOffArrayTextToAnErrorAndNoRun() {
    const harness = installHarness([buildVersion({ a: 0 }, getQuestions(), 1, 't')], 0, '[{"a":1}]', JSON.stringify(getQuestions()), []);
    await executeSubmitForMode();
    expect(harness.elements.errorLine.textContent).toBe('state must be one JSON object: turn on batch to submit an array');
    expect(harness.fetchOrder).toEqual([]);
}

function registerSubmitBatchTests() {
    afterEach(resetHarness);
    test('test_dispatcher_sends_batch_on_to_the_batch_submit', validateDispatcherSendsBatchOnToTheBatchSubmit);
    test('test_dispatcher_sends_batch_off_array_text_to_an_error_and_no_run', validateDispatcherSendsBatchOffArrayTextToAnErrorAndNoRun);
}

describe('submit batch dispatcher', registerSubmitBatchTests);
