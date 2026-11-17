import { test, expect, afterEach } from 'bun:test'
import { pageState } from '../page/state'
import { executeSubmitBatch } from './submitBatch'
import { NOT_RUN_TIME } from '../../history/notRunTime'
import { HARD_CODED_STATE } from '../../providers/typeSafeQuery'
import { QUESTIONS, buildVersion, installHarness, restoreHarness, startBatchOn } from './submitBatchHarness.test'

afterEach(restoreHarness)

async function validateVersionFourExampleKeepsTheFirstItemOnVersionFourAndAppendsTheSecond() {
    // Step: version 4 has results and the state {"a":1}, the same questions are in the editor.
    const versions = [buildVersion({ z: 1 }, QUESTIONS, 1, 't'), buildVersion({ z: 2 }, QUESTIONS, 1, 't'), buildVersion({ z: 3 }, QUESTIONS, 1, 't'), buildVersion({ a: 1 }, QUESTIONS, 2, 't')]
    const harness = installHarness(versions, 3, '[{"a":1},{"a":2}]', JSON.stringify(QUESTIONS), [])
    startBatchOn()
    await executeSubmitBatch()
    // Step: one /open holds 5 versions, version 5 is the second item and not run yet.
    expect(harness.openBodies.length).toBe(1)
    expect(harness.openBodies[0].length).toBe(5)
    expect(harness.openBodies[0][4]).toEqual({ time: NOT_RUN_TIME, state: { a: 2 }, questions: QUESTIONS, calls: 0, outputs: [] })
    // Step: the runs go to version 4 (index 3) then version 5 (index 4), each with its own state.
    expect(harness.runs.map((run) => run.index)).toEqual([3, 4])
    expect(harness.runs.map((run) => run.state)).toEqual([{ a: 1 }, { a: 2 }])
    // Step: results for {"a":1} add to version 4.
    expect(pageState.versions[3].calls).toBe(5)
    expect(pageState.versions[4].calls).toBe(3)
    expect(pageState.index).toBe(3)
}

async function validateFirstItemOverwriteReplacesTheShownVersionAndMakesNoNewVersion() {
    const shown = buildVersion(HARD_CODED_STATE, { old: 1 }, 0, NOT_RUN_TIME)
    const harness = installHarness([shown], 0, '[{"a":1}]', JSON.stringify(QUESTIONS), [])
    startBatchOn()
    await executeSubmitBatch()
    expect(harness.openBodies[0].length).toBe(1)
    expect(harness.openBodies[0][0].state).toEqual({ a: 1 })
    expect(harness.openBodies[0][0].questions).toEqual(QUESTIONS)
    expect(harness.runs.map((run) => run.index)).toEqual([0])
}

async function validateFirstItemCreateMakesANewVersionAtTheEndAndShowsIt() {
    const versions = [buildVersion({ a: 1 }, QUESTIONS, 2, 't'), buildVersion({ b: 1 }, QUESTIONS, 1, 't')]
    const harness = installHarness(versions, 0, '[{"c":1},{"c":2},{"c":3}]', JSON.stringify(QUESTIONS), [])
    startBatchOn()
    await executeSubmitBatch()
    expect(harness.openBodies[0].length).toBe(5)
    expect(harness.runs.map((run) => run.index)).toEqual([2, 3, 4])
    expect(pageState.index).toBe(2)
}

async function validateFiveStatesWithCallsThreeSendFiveRunsOfThreeCallsEachInOrder() {
    // Step: the batch has 5 states and the Calls field says 3.
    const harness = installHarness([buildVersion({ a: 0 }, QUESTIONS, 1, 't')], 0, '[{"a":1},{"a":2},{"a":3},{"a":4},{"a":5}]', JSON.stringify(QUESTIONS), [])
    startBatchOn()
    await executeSubmitBatch()
    // Step: 15 calls (5 runs of 3) go to versions 2 to 6 in array order.
    expect(harness.runs.length).toBe(5)
    expect(harness.runs.map((run) => run.calls)).toEqual([3, 3, 3, 3, 3])
    expect(harness.runs.map((run) => run.index)).toEqual([1, 2, 3, 4, 5])
    expect(harness.runs.map((run) => run.state)).toEqual([{ a: 1 }, { a: 2 }, { a: 3 }, { a: 4 }, { a: 5 }])
    expect(harness.runs.every((run) => JSON.stringify(run.questions) === JSON.stringify(QUESTIONS))).toBe(true)
    // Step: the buttons said "running k of 5" and all controls were disabled during the runs.
    expect(harness.runs.map((run) => run.buttonText)).toEqual(['running 1 of 5', 'running 2 of 5', 'running 3 of 5', 'running 4 of 5', 'running 5 of 5'])
    expect(harness.runs.every((run) => run.isButtonDisabled && run.isToggleDisabled && run.isNewDisabled && run.areEditorsLocked)).toBe(true)
    // Step: the page stayed on the first item's version (index 1) during the runs.
    expect(harness.runs.every((run) => run.shownIndex === 1)).toBe(true)
}

async function validateAfterTheLastRunTheToggleIsOffTheControlsAreNormalAndTheDraftIsCleared() {
    const harness = installHarness([buildVersion({ a: 0 }, QUESTIONS, 1, 't')], 0, '[{"a":1},{"a":2}]', JSON.stringify(QUESTIONS), [])
    startBatchOn()
    await executeSubmitBatch()
    expect(pageState.isBatchOn).toBe(false)
    expect(pageState.batchRun).toBeNull()
    expect(harness.elements.batchCheckbox.checked).toBe(false)
    expect(harness.elements.batchCheckbox.disabled).toBe(false)
    expect(harness.elements.submitButton.textContent).toBe('Submit (paid)')
    expect(harness.elements.submitButton.disabled).toBe(false)
    expect(harness.elements.newButton.disabled).toBe(false)
    expect(harness.locks[harness.locks.length - 1]).toBe(false)
    expect(pageState.editedDraft).toBeNull()
    // Step: before the first run, the draft was sent with toggle off and the editor's first item state.
    expect(harness.drafts.length).toBe(1)
    expect(harness.drafts[0].isBatch).toBe(false)
    expect(harness.drafts[0].state).toBe(JSON.stringify({ a: 1 }))
    expect(harness.fetchOrder.indexOf('/draft')).toBeLessThan(harness.fetchOrder.indexOf('/run'))
    expect(harness.elements.lastEditedLabel.textContent.startsWith('last run: ')).toBe(true)
    expect(pageState.isDirty).toBe(true)
}

test('test_version_four_example_keeps_the_first_item_on_version_four_and_appends_the_second', validateVersionFourExampleKeepsTheFirstItemOnVersionFourAndAppendsTheSecond)
test('test_first_item_overwrite_replaces_the_shown_version_and_makes_no_new_version', validateFirstItemOverwriteReplacesTheShownVersionAndMakesNoNewVersion)
test('test_first_item_create_makes_a_new_version_at_the_end_and_shows_it', validateFirstItemCreateMakesANewVersionAtTheEndAndShowsIt)
test('test_five_states_with_calls_three_send_five_runs_of_three_calls_each_in_order', validateFiveStatesWithCallsThreeSendFiveRunsOfThreeCallsEachInOrder)
test('test_after_the_last_run_the_toggle_is_off_the_controls_are_normal_and_the_draft_is_cleared', validateAfterTheLastRunTheToggleIsOffTheControlsAreNormalAndTheDraftIsCleared)
