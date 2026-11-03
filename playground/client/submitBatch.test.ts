import { test, expect, afterEach, spyOn, mock } from 'bun:test'
import type { EditorView } from '@codemirror/view'
import type { Questions } from '@typesafe-ai/sdk'
import type { Version } from '../playgroundHistory'
import * as editors from './editors'
import * as graphs from './graphs'
import * as winnersDom from './winnersDom'
import { LOCKED_BUTTON_IDS } from './batchControls'
import { pageState } from './state'
import { executeSubmitBatch, executeSubmitForMode } from './submitBatch'
import { SUBMIT_TEXT } from './submit'
import { NOT_RUN_TIME } from '../notRunTime'
import { HARD_CODED_STATE } from '../typeSafeQuery'

class FakeButton { disabled = false; textContent = SUBMIT_TEXT }
class FakeInput { value = ''; type = 'password'; checked = false; disabled = false; placeholder = '' }
class FakeBox { textContent = '' }

const realFetch = globalThis.fetch
const OUTPUT = { answers: {}, usage: { input_tokens: 1000000, output_tokens: 1 } }
// const QUESTIONS = { q: { type: 'noul', instructions: 'x' } }
const QUESTIONS = { q: { type: 'noul', instructions: 'x' } } as unknown as Questions

type RunSnapshot = { index: number; calls: number; state: unknown; questions: unknown; buttonText: string; isButtonDisabled: boolean; isToggleDisabled: boolean; isNewDisabled: boolean; areEditorsLocked: boolean; shownIndex: number }
type Harness = { elements: Record<string, FakeButton & FakeInput & FakeBox>; history: Version[]; runs: RunSnapshot[]; notes: { index: number; body: Record<string, unknown> }[]; drafts: Record<string, unknown>[]; alerts: string[]; openBodies: Version[][]; locks: boolean[]; stateText: { value: string }; questionsText: { value: string }; fetchOrder: string[] }

function buildVersion(state: unknown, questions: unknown, outputCount: number, time: string): Version {
    const outputs = []
    for (let i = 0; i < outputCount; i++)
        outputs.push(OUTPUT)
    return { time, state, questions, calls: outputCount, outputs } as unknown as Version
}

function installHarness(initial: Version[], shownIndex: number, stateText: string, questionsText: string, failingIndexes: number[], hasEnvKey = true): Harness {
    const elements: Record<string, unknown> = {
        data: new FakeBox(), errorLine: new FakeBox(), versionLabel: new FakeBox(), costLabel: new FakeBox(), totalCostLabel: new FakeBox(), tokensLabel: new FakeBox(), lastEditedLabel: new FakeBox(),
        graphContainerBox: new FakeBox(), winnerBox: new FakeBox(), batchCheckbox: new FakeInput(), typeSafeKeyEditor: new FakeInput(), noteText: new FakeInput(), callsPicker: new FakeInput(),
    }
    const buttonIds = [...LOCKED_BUTTON_IDS, 'resetButton', 'submitButton', 'prevVersionButton', 'nextVersionButton', 'deleteVersionButton', 'pinButton', 'unpinButton']
    for (const id of buttonIds)
        elements[id] = new FakeButton()
    const typedElements = elements as Harness['elements']
    typedElements.data.textContent = JSON.stringify({ versions: [], hasEnvKey })
    typedElements.callsPicker.value = '3'
    typedElements.batchCheckbox.checked = true
    Object.assign(globalThis, { document: { getElementById: (id: string) => elements[id] ?? null }, HTMLButtonElement: FakeButton, HTMLInputElement: FakeInput, HTMLTextAreaElement: FakeInput })
    const harness: Harness = { elements: typedElements, history: [], runs: [], notes: [], drafts: [], alerts: [], openBodies: [], locks: [], stateText: { value: stateText }, questionsText: { value: questionsText }, fetchOrder: [] }
    function buildStubEditor(text: { value: string }) {
        return { state: { doc: { toString: () => text.value } }, dispatch: () => {} } as unknown as EditorView
    }
    spyOn(editors, 'getStateEditor').mockReturnValue(buildStubEditor(harness.stateText))
    spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildStubEditor(harness.questionsText))
    spyOn(editors, 'renderStateJson').mockImplementation((value: unknown) => { harness.stateText.value = JSON.stringify(value) })
    spyOn(editors, 'renderQuestionsJson').mockImplementation((value: unknown) => { harness.questionsText.value = JSON.stringify(value) })
    spyOn(editors, 'renderResultJson').mockImplementation(() => {})
    spyOn(editors, 'setEditorLocked').mockImplementation((_editor: EditorView, isLocked: boolean) => { harness.locks.push(isLocked) })
    spyOn(graphs, 'renderGraphs').mockImplementation(() => {})
    spyOn(winnersDom, 'renderWinners').mockImplementation(() => {})
    Object.assign(globalThis, { alert: (message: string) => harness.alerts.push(message) })
    harness.history = JSON.parse(JSON.stringify(initial))
    pageState.versions = initial
    pageState.index = shownIndex
    async function stubFetch(path: string | URL | Request, init?: RequestInit) {
        const route = String(path)
        harness.fetchOrder.push(route)
        const body = JSON.parse(String(init?.body))
        if (route === '/open') {
            harness.openBodies.push(body.versions)
            harness.history = JSON.parse(JSON.stringify(body.versions))
            return Response.json({ versions: harness.history })
        }
        if (route === '/note') {
            harness.notes.push({ index: body.index, body })
            harness.history[body.index].questionsNote = body.questionsNote
            return Response.json(harness.history[body.index])
        }
        if (route === '/draft') {
            harness.drafts.push(body)
            return new Response('ok')
        }
        const snapshot: RunSnapshot = {
            index: body.index, calls: body.calls, state: body.state, questions: body.questions,
            buttonText: typedElements.submitButton.textContent, isButtonDisabled: typedElements.submitButton.disabled,
            isToggleDisabled: typedElements.batchCheckbox.disabled, isNewDisabled: typedElements.newButton.disabled,
            areEditorsLocked: harness.locks[harness.locks.length - 1] === true, shownIndex: pageState.index,
        }
        harness.runs.push(snapshot)
        if (failingIndexes.includes(body.index))
            return new Response('boom', { status: 500 })
        const version = harness.history[body.index]
        for (let i = 0; i < body.calls; i++)
            version.outputs.push(OUTPUT as never)
        version.calls += body.calls
        version.time = new Date().toISOString()
        return Response.json({ outputs: [], version, index: body.index })
    }
    globalThis.fetch = stubFetch as unknown as typeof fetch
    return harness
}

afterEach(() => {
    mock.restore()
    for (const name of ['document', 'HTMLButtonElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'alert'])
        Reflect.deleteProperty(globalThis, name)
    globalThis.fetch = realFetch
    pageState.versions = []
    pageState.index = 0
    pageState.isDirty = false
    pageState.isBatchOn = false
    pageState.batchRun = null
    pageState.editedDraft = null
    pageState.pendingNotes = { state: null, questions: null }
})

function startBatchOn() {
    pageState.isBatchOn = true
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
    ]
    for (const [stateText, expectedStart] of badStateTexts) {
        const harness = installHarness([buildVersion({ a: 1 }, QUESTIONS, 1, 't')], 0, stateText, JSON.stringify(QUESTIONS), [])
        startBatchOn()
        harness.elements.errorLine.textContent = 'old error'
        await executeSubmitBatch()
        // Step: the error line shows the message, nothing was sent, and the toggle stays on.
        expect(harness.elements.errorLine.textContent.startsWith(expectedStart)).toBe(true)
        expect(harness.fetchOrder).toEqual([])
        expect(pageState.isBatchOn).toBe(true)
        expect(pageState.versions.length).toBe(1)
        mock.restore()
    }
}

async function validateBadQuestionsShowTheTodayErrorAndChangeNothing() {
    const harness = installHarness([buildVersion({ a: 1 }, QUESTIONS, 1, 't')], 0, '[{"a": 1}]', '{"q": ', [])
    startBatchOn()
    await executeSubmitBatch()
    expect(harness.elements.errorLine.textContent.startsWith('questions is not valid JSON')).toBe(true)
    expect(harness.fetchOrder).toEqual([])
    expect(pageState.isBatchOn).toBe(true)
}

async function validateQuestionsArrayShowsTheMessageAndSendsNothing() {
    const harness = installHarness([buildVersion({ a: 1 }, QUESTIONS, 1, 't')], 0, '[{"a": 1}]', '[]', [])
    startBatchOn()
    await executeSubmitBatch()
    expect(harness.elements.errorLine.textContent).toBe('questions must be a JSON object')
    expect(harness.fetchOrder).toEqual([])
    expect(pageState.isBatchOn).toBe(true)
    expect(pageState.versions.length).toBe(1)
}

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

async function validateNewVersionsGetTheShownQuestionsNoteWhenQuestionsAreUnchanged() {
    // Step: the shown version has results, a questions note and a state note.
    const shown = buildVersion({ a: 1 }, QUESTIONS, 1, 't')
    shown.questionsNote = 'q note'
    shown.stateNote = 's note'
    const harness = installHarness([shown], 0, '[{"a":2},{"a":3}]', JSON.stringify(QUESTIONS), [])
    startBatchOn()
    await executeSubmitBatch()
    // Step: both new versions get the questions note, and no new version gets a state note.
    expect(harness.notes.map((note) => note.index)).toEqual([1, 2])
    expect(harness.notes.every((note) => note.body.questionsNote === 'q note')).toBe(true)
    expect(harness.notes.some((note) => 'stateNote' in note.body)).toBe(false)
    expect(pageState.versions[1].stateNote).toBeUndefined()
    expect(pageState.versions[0].questionsNote).toBe('q note')
}

async function validateNoNoteIsCopiedWhenTheQuestionsChanged() {
    const shown = buildVersion({ a: 1 }, QUESTIONS, 1, 't')
    shown.questionsNote = 'q note'
    const harness = installHarness([shown], 0, '[{"a":2}]', JSON.stringify({ other: { type: 'noul' } }), [])
    startBatchOn()
    await executeSubmitBatch()
    expect(harness.notes).toEqual([])
}

async function validateKeptAndOverwrittenVersionsKeepTheirOwnNotesAndGetNoCopy() {
    const shown = buildVersion({ a: 1 }, QUESTIONS, 1, 't')
    shown.questionsNote = 'q note'
    const harness = installHarness([shown], 0, '[{"a":1}]', JSON.stringify(QUESTIONS), [])
    startBatchOn()
    await executeSubmitBatch()
    expect(harness.notes).toEqual([])
    expect(pageState.versions[0].questionsNote).toBe('q note')
}

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

test('test_every_validation_error_shows_an_error_and_changes_nothing', validateEveryValidationErrorShowsAnErrorAndChangesNothing)
test('test_bad_questions_show_the_today_error_and_change_nothing', validateBadQuestionsShowTheTodayErrorAndChangeNothing)
test('test_questions_array_shows_the_message_and_sends_nothing', validateQuestionsArrayShowsTheMessageAndSendsNothing)
test('test_version_four_example_keeps_the_first_item_on_version_four_and_appends_the_second', validateVersionFourExampleKeepsTheFirstItemOnVersionFourAndAppendsTheSecond)
test('test_first_item_overwrite_replaces_the_shown_version_and_makes_no_new_version', validateFirstItemOverwriteReplacesTheShownVersionAndMakesNoNewVersion)
test('test_first_item_create_makes_a_new_version_at_the_end_and_shows_it', validateFirstItemCreateMakesANewVersionAtTheEndAndShowsIt)
test('test_five_states_with_calls_three_send_five_runs_of_three_calls_each_in_order', validateFiveStatesWithCallsThreeSendFiveRunsOfThreeCallsEachInOrder)
test('test_after_the_last_run_the_toggle_is_off_the_controls_are_normal_and_the_draft_is_cleared', validateAfterTheLastRunTheToggleIsOffTheControlsAreNormalAndTheDraftIsCleared)
test('test_total_cost_grows_as_each_run_finishes', validateTotalCostGrowsAsEachRunFinishes)
test('test_one_failed_run_does_not_stop_the_others_and_gives_one_popup', validateOneFailedRunDoesNotStopTheOthersAndGivesOnePopup)
test('test_all_runs_ok_gives_no_popup', validateAllRunsOkGivesNoPopup)
test('test_two_failed_runs_give_one_popup_listing_both', validateTwoFailedRunsGiveOnePopupListingBoth)
test('test_rejected_fetch_throws_but_still_unlocks_the_page', validateRejectedFetchThrowsButStillUnlocksThePage)
test('test_new_versions_get_the_shown_questions_note_when_questions_are_unchanged', validateNewVersionsGetTheShownQuestionsNoteWhenQuestionsAreUnchanged)
test('test_no_note_is_copied_when_the_questions_changed', validateNoNoteIsCopiedWhenTheQuestionsChanged)
test('test_kept_and_overwritten_versions_keep_their_own_notes_and_get_no_copy', validateKeptAndOverwrittenVersionsKeepTheirOwnNotesAndGetNoCopy)
test('test_dispatcher_sends_batch_on_to_the_batch_submit', validateDispatcherSendsBatchOnToTheBatchSubmit)
test('test_dispatcher_sends_batch_off_array_text_to_an_error_and_no_run', validateDispatcherSendsBatchOffArrayTextToAnErrorAndNoRun)
