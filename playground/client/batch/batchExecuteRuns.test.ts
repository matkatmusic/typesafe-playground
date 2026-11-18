import { test, expect, afterEach, describe } from 'bun:test';
import { executeSubmitBatch } from './submitBatch';
import { getQuestions, buildVersion, installHarness, resetHarness, enableBatch } from './submitBatchHarness.test';
import { getRunIndexes, getRunStates, getRunCalls, getRunButtonTexts, isEveryRunUsingTheQuestions, isEveryRunLockingTheControls, isEveryRunShowingIndex } from './batchExecuteRunReaders';

async function validateFiveStatesWithCallsThreeSendFiveRunsOfThreeCallsEachInOrder() {
    // Step: the batch has 5 states and the Calls field says 3.
    const harness = installHarness([buildVersion({ a: 0 }, getQuestions(), 1, 't')], 0, '[{"a":1},{"a":2},{"a":3},{"a":4},{"a":5}]', JSON.stringify(getQuestions()), []);
    enableBatch();
    await executeSubmitBatch();
    // Step: 15 calls (5 runs of 3) go to versions 2 to 6 in array order.
    expect(harness.runs.length).toBe(5);
    expect(getRunCalls(harness.runs)).toEqual([3, 3, 3, 3, 3]);
    expect(getRunIndexes(harness.runs)).toEqual([1, 2, 3, 4, 5]);
    expect(getRunStates(harness.runs)).toEqual([{ a: 1 }, { a: 2 }, { a: 3 }, { a: 4 }, { a: 5 }]);
    expect(isEveryRunUsingTheQuestions(harness.runs)).toBe(true);
    // Step: the buttons said "running k of 5" and all controls were disabled during the runs.
    expect(getRunButtonTexts(harness.runs)).toEqual(['running 1 of 5', 'running 2 of 5', 'running 3 of 5', 'running 4 of 5', 'running 5 of 5']);
    expect(isEveryRunLockingTheControls(harness.runs)).toBe(true);
    // Step: the page stayed on the first item's version (index 1) during the runs.
    expect(isEveryRunShowingIndex(harness.runs, 1)).toBe(true);
}

function registerBatchExecuteRunsTests() {
    afterEach(resetHarness);
    test('test_five_states_with_calls_three_send_five_runs_of_three_calls_each_in_order', validateFiveStatesWithCallsThreeSendFiveRunsOfThreeCallsEachInOrder);
}

describe('batchExecuteRuns', registerBatchExecuteRunsTests);
