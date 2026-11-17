import { test, expect, afterEach } from 'bun:test'
import { pageState } from './state'
import { executeSubmitBatch } from './submitBatch'
import { NOT_RUN_TIME } from '../notRunTime'
import { QUESTIONS, buildVersion, installHarness, restoreHarness, startBatchOn } from './submitBatchHarness.test'

afterEach(restoreHarness)

async function validateTotalCostGrowsAsEachRunFinishes() {
    const harness = installHarness([buildVersion({ a: 0 }, QUESTIONS, 0, NOT_RUN_TIME)], 0, '[{"a":1},{"a":2}]', JSON.stringify(QUESTIONS), [])
    startBatchOn()
    const seenTotals: string[] = []
    const innerFetch = globalThis.fetch
    async function recordingFetch(path: string | URL | Request, init?: RequestInit) {
        if (String(path) === '/run')
            seenTotals.push(harness.elements.totalCostLabel.textContent)
        return innerFetch(path, init)
    }
    globalThis.fetch = recordingFetch as unknown as typeof fetch
    await executeSubmitBatch()
    // Step: each run adds 3 outputs of 1000000 input tokens: 3 * 0.042 = 0.126 per version.
    expect(seenTotals[1]).toBe('total cost: $0.126000')
    expect(harness.elements.totalCostLabel.textContent).toBe('total cost: $0.252000')
}

async function validateOneFailedRunDoesNotStopTheOthersAndGivesOnePopup() {
    const harness = installHarness([buildVersion({ a: 0 }, QUESTIONS, 1, 't')], 0, '[{"a":1},{"a":2},{"a":3}]', JSON.stringify(QUESTIONS), [2])
    startBatchOn()
    await executeSubmitBatch()
    // Step: all three runs were tried, the failed one is version 3 (index 2).
    expect(harness.runs.map((run) => run.index)).toEqual([1, 2, 3])
    expect(pageState.versions[2].calls).toBe(0)
    expect(pageState.versions[3].calls).toBe(3)
    // Step: one popup lists the failed version number and its error.
    expect(harness.alerts).toEqual(['Some runs failed:\nversion 3: Run failed: 500 boom'])
    expect(harness.elements.submitButton.textContent).toBe('Submit (paid)')
}

async function validateAllRunsOkGivesNoPopup() {
    const harness = installHarness([buildVersion({ a: 0 }, QUESTIONS, 1, 't')], 0, '[{"a":1}]', JSON.stringify(QUESTIONS), [])
    startBatchOn()
    await executeSubmitBatch()
    expect(harness.alerts).toEqual([])
}

async function validateTwoFailedRunsGiveOnePopupListingBoth() {
    const harness = installHarness([buildVersion({ a: 0 }, QUESTIONS, 1, 't')], 0, '[{"a":1},{"a":2}]', JSON.stringify(QUESTIONS), [1, 2])
    startBatchOn()
    await executeSubmitBatch()
    expect(harness.alerts).toEqual(['Some runs failed:\nversion 2: Run failed: 500 boom\nversion 3: Run failed: 500 boom'])
}

async function validateRejectedFetchThrowsButStillUnlocksThePage() {
    const harness = installHarness([buildVersion({ a: 0 }, QUESTIONS, 1, 't')], 0, '[{"a":1}]', JSON.stringify(QUESTIONS), [])
    startBatchOn()
    const innerFetch = globalThis.fetch
    async function rejectingFetch(path: string | URL | Request, init?: RequestInit) {
        if (String(path) === '/run')
            throw new Error('network down')
        return innerFetch(path, init)
    }
    globalThis.fetch = rejectingFetch as unknown as typeof fetch
    await expect(executeSubmitBatch()).rejects.toThrow('network down')
    expect(pageState.batchRun).toBeNull()
    expect(harness.locks[harness.locks.length - 1]).toBe(false)
    expect(harness.elements.submitButton.textContent).toBe('Submit (paid)')
    expect(harness.elements.newButton.disabled).toBe(false)
}

test('test_total_cost_grows_as_each_run_finishes', validateTotalCostGrowsAsEachRunFinishes)
test('test_one_failed_run_does_not_stop_the_others_and_gives_one_popup', validateOneFailedRunDoesNotStopTheOthersAndGivesOnePopup)
test('test_all_runs_ok_gives_no_popup', validateAllRunsOkGivesNoPopup)
test('test_two_failed_runs_give_one_popup_listing_both', validateTwoFailedRunsGiveOnePopupListingBoth)
test('test_rejected_fetch_throws_but_still_unlocks_the_page', validateRejectedFetchThrowsButStillUnlocksThePage)
