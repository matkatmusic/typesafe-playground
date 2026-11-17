import { test, expect, afterEach } from 'bun:test'
import { executeSubmitForMode } from './submitBatch'
import { QUESTIONS, buildVersion, installHarness, restoreHarness, startBatchOn } from './submitBatchHarness.test'

afterEach(restoreHarness)

async function validateDispatcherSendsBatchOnToTheBatchSubmit() {
    const harness = installHarness([buildVersion({ a: 0 }, QUESTIONS, 1, 't')], 0, '[{"a":1}]', JSON.stringify(QUESTIONS), [])
    startBatchOn()
    await executeSubmitForMode()
    expect(harness.runs.length).toBe(1)
}

async function validateDispatcherSendsBatchOffArrayTextToAnErrorAndNoRun() {
    const harness = installHarness([buildVersion({ a: 0 }, QUESTIONS, 1, 't')], 0, '[{"a":1}]', JSON.stringify(QUESTIONS), [])
    await executeSubmitForMode()
    expect(harness.elements.errorLine.textContent).toBe('state must be one JSON object: turn on batch to submit an array')
    expect(harness.fetchOrder).toEqual([])
}

test('test_dispatcher_sends_batch_on_to_the_batch_submit', validateDispatcherSendsBatchOnToTheBatchSubmit)
test('test_dispatcher_sends_batch_off_array_text_to_an_error_and_no_run', validateDispatcherSendsBatchOffArrayTextToAnErrorAndNoRun)
