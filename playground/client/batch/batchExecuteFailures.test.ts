import { test, expect, afterEach, describe } from 'bun:test';
import { pageState } from '../page/state';
import { executeSubmitBatch } from './submitBatch';
import { getNotRunTime } from '../../history/notRunTime';
import { getQuestions, buildVersion, installHarness, resetHarness, enableBatch } from './submitBatchHarness.test';

function installTotalCollectingRunFetch(seenTotals: string[], readTotalCostText: () => string) {
    const innerFetch = globalThis.fetch;
    async function collectTotalBeforeFetch(path: string | URL | Request, init?: RequestInit) {
        const pathText = String(path);
        if (pathText === '/run')
            seenTotals.push(readTotalCostText());
        return innerFetch(path, init);
    }
    globalThis.fetch = collectTotalBeforeFetch as unknown as typeof fetch;
}

async function validateTotalCostGrowsAsEachRunFinishes() {
    const harness = installHarness([buildVersion({ a: 0 }, getQuestions(), 0, getNotRunTime())], 0, '[{"a":1},{"a":2}]', JSON.stringify(getQuestions()), []);
    enableBatch();
    const seenTotals: string[] = [];
    function readTotalCostText() {
        return harness.elements.totalCostLabel.textContent;
    }
    installTotalCollectingRunFetch(seenTotals, readTotalCostText);
    await executeSubmitBatch();
    // Step: each run adds 3 outputs of 1000000 input tokens: 3 * 0.042 = 0.126 per version.
    expect(seenTotals[1]).toBe('total cost: $0.126000');
    expect(harness.elements.totalCostLabel.textContent).toBe('total cost: $0.252000');
}

async function validateOneFailedRunDoesNotStopTheOthersAndGivesOnePopup() {
    const harness = installHarness([buildVersion({ a: 0 }, getQuestions(), 1, 't')], 0, '[{"a":1},{"a":2},{"a":3}]', JSON.stringify(getQuestions()), [2]);
    enableBatch();
    await executeSubmitBatch();
    // Step: all three runs were tried, the failed one is version 3 (index 2).
    const runIndexes: number[] = [];
    for (const run of harness.runs) {
        runIndexes.push(run.index);
    }
    expect(runIndexes).toEqual([1, 2, 3]);
    expect(pageState.versions[2].calls).toBe(0);
    expect(pageState.versions[3].calls).toBe(3);
    // Step: one popup lists the failed version number and its error.
    expect(harness.alerts).toEqual(['Some runs failed:\nversion 3: Run failed: 500 boom']);
    expect(harness.elements.submitButton.textContent).toBe('Submit (paid)');
}

async function validateAllRunsOkGivesNoPopup() {
    const harness = installHarness([buildVersion({ a: 0 }, getQuestions(), 1, 't')], 0, '[{"a":1}]', JSON.stringify(getQuestions()), []);
    enableBatch();
    await executeSubmitBatch();
    expect(harness.alerts).toEqual([]);
}

async function validateTwoFailedRunsGiveOnePopupListingBoth() {
    const harness = installHarness([buildVersion({ a: 0 }, getQuestions(), 1, 't')], 0, '[{"a":1},{"a":2}]', JSON.stringify(getQuestions()), [1, 2]);
    enableBatch();
    await executeSubmitBatch();
    expect(harness.alerts).toEqual(['Some runs failed:\nversion 2: Run failed: 500 boom\nversion 3: Run failed: 500 boom']);
}

function installNetworkDownRunFetch() {
    const innerFetch = globalThis.fetch;
    async function fetchUnlessRunPath(path: string | URL | Request, init?: RequestInit) {
        const pathText = String(path);
        if (pathText === '/run')
            throw new Error('network down');
        return innerFetch(path, init);
    }
    globalThis.fetch = fetchUnlessRunPath as unknown as typeof fetch;
}

async function validateRejectedFetchThrowsButStillUnlocksThePage() {
    const harness = installHarness([buildVersion({ a: 0 }, getQuestions(), 1, 't')], 0, '[{"a":1}]', JSON.stringify(getQuestions()), []);
    enableBatch();
    installNetworkDownRunFetch();
    await expect(executeSubmitBatch()).rejects.toThrow('network down');
    expect(pageState.batchRun).toBeNull();
    expect(harness.locks[harness.locks.length - 1]).toBe(false);
    expect(harness.elements.submitButton.textContent).toBe('Submit (paid)');
    expect(harness.elements.newButton.disabled).toBe(false);
}

function registerBatchExecuteFailureTests() {
    afterEach(resetHarness);
    test('test_total_cost_grows_as_each_run_finishes', validateTotalCostGrowsAsEachRunFinishes);
    test('test_one_failed_run_does_not_stop_the_others_and_gives_one_popup', validateOneFailedRunDoesNotStopTheOthersAndGivesOnePopup);
    test('test_all_runs_ok_gives_no_popup', validateAllRunsOkGivesNoPopup);
    test('test_two_failed_runs_give_one_popup_listing_both', validateTwoFailedRunsGiveOnePopupListingBoth);
    test('test_rejected_fetch_throws_but_still_unlocks_the_page', validateRejectedFetchThrowsButStillUnlocksThePage);
}

describe('batch execute failures', registerBatchExecuteFailureTests);
