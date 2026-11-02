import { test, expect, afterEach, spyOn, mock } from 'bun:test'
import type { EditorView } from '@codemirror/view'
import type { Version } from '../playgroundHistory'
import * as editors from './editors'
import { applyBatchMode, BATCH_SUBMIT_TEXT, formatBatchSubmitText, LOCKED_BUTTON_IDS, refreshBatchControls } from './batchControls'
import { pageState } from './state'
import { SUBMIT_TEXT } from './submit'
import { moveByVersions } from './versionBox'

class FakeButton { disabled = false; textContent = SUBMIT_TEXT }
class FakeInput { value = ''; type = 'password'; checked = false; disabled = false; placeholder = '' }
class FakeBox { textContent = '' }

const RESULT_OUTPUT = { usage: { input_tokens: 1, output_tokens: 1 } }
const VERSION_WITH_RESULTS = { time: 't', state: { a: 1 }, questions: {}, calls: 1, outputs: [RESULT_OUTPUT] } as unknown as Version
const VERSION_TWO = { time: 't', state: { a: 2 }, questions: {}, calls: 1, outputs: [RESULT_OUTPUT] } as unknown as Version
const NORMAL_STATE_TEXT = '{"a":1}'
const dispatchedSpecs: unknown[] = []

function installFakeDom(hasEnvKey: boolean) {
    const elements: Record<string, unknown> = {
        data: new FakeBox(), errorLine: new FakeBox(), versionLabel: new FakeBox(),
        batchCheckbox: new FakeInput(), typeSafeKeyEditor: new FakeInput(), noteText: new FakeInput(),
    }
    const buttonIds = [...LOCKED_BUTTON_IDS, 'resetButton', 'submitButton', 'prevVersionButton', 'nextVersionButton', 'deleteVersionButton', 'pinButton', 'unpinButton']
    for (const id of buttonIds)
        elements[id] = new FakeButton()
    ;(elements.data as FakeBox).textContent = JSON.stringify({ versions: [], hasEnvKey })
    Object.assign(globalThis, { document: { getElementById: (id: string) => elements[id] ?? null }, HTMLButtonElement: FakeButton, HTMLInputElement: FakeInput, HTMLTextAreaElement: FakeInput })
    return elements as Record<string, FakeButton & FakeInput & FakeBox>
}

function buildStubEditor(text: string) {
    return { state: { doc: { toString: () => text } }, dispatch: (spec: unknown) => dispatchedSpecs.push(spec) } as unknown as EditorView
}

function installStubEditors(stateText: string) {
    spyOn(editors, 'getStateEditor').mockReturnValue(buildStubEditor(stateText))
    spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildStubEditor('{}'))
}

afterEach(() => {
    mock.restore()
    for (const name of ['document', 'HTMLButtonElement', 'HTMLInputElement', 'HTMLTextAreaElement'])
        Reflect.deleteProperty(globalThis, name)
    pageState.versions = []
    pageState.index = 0
    pageState.isBatchOn = false
    pageState.batchRun = null
    pageState.fileHandle = null
    pageState.pinnedIndex = null
    dispatchedSpecs.length = 0
})

function listEnabled(elements: Record<string, FakeButton>, ids: string[]): string[] {
    return ids.filter((id) => !elements[id].disabled)
}

const BATCH_ON_DISABLED_IDS = ['saveButton', 'prevVersionButton', 'nextVersionButton', 'newButton', 'openButton', 'resetButton', 'reportButton', 'deleteVersionButton', 'resetRunsButton', 'pinButton', 'unpinButton', 'noteText', 'stateNotesButton', 'questionsNotesButton']

function validateSubmitTextFollowsTheModeAndTheRunProgress() {
    expect(formatBatchSubmitText(false, null)).toBe('Submit (paid)')
    expect(formatBatchSubmitText(true, null)).toBe(BATCH_SUBMIT_TEXT)
    expect(BATCH_SUBMIT_TEXT).toBe('Submit Batch (paid)')
    expect(formatBatchSubmitText(false, { item: 2, count: 5 })).toBe('running 2 of 5')
}

function validateBatchOnDisablesEveryListedControlAndKeepsSubmitUsable() {
    // Step: two versions with results, a file open, one version pinned, an env key present.
    const elements = installFakeDom(true)
    installStubEditors(NORMAL_STATE_TEXT)
    pageState.versions = [VERSION_WITH_RESULTS, VERSION_TWO]
    pageState.fileHandle = {} as FileSystemFileHandle
    pageState.pinnedIndex = 1
    // Step: before batch, every listed control is enabled (pin: the shown version is not the pinned one).
    refreshBatchControls()
    expect(listEnabled(elements, BATCH_ON_DISABLED_IDS).sort()).toEqual([...BATCH_ON_DISABLED_IDS].sort())
    // Step: turn batch on.
    applyBatchMode(true)
    // Step: every listed control is disabled, the toggle and the submit button are usable.
    expect(listEnabled(elements, BATCH_ON_DISABLED_IDS)).toEqual([])
    expect(elements.batchCheckbox.disabled).toBe(false)
    expect(elements.batchCheckbox.checked).toBe(true)
    expect(elements.submitButton.disabled).toBe(false)
    expect(elements.submitButton.textContent).toBe('Submit Batch (paid)')
}

function validateBatchOnStopsTheArrowKeysFromMoving() {
    installFakeDom(true)
    installStubEditors(NORMAL_STATE_TEXT)
    pageState.versions = [VERSION_WITH_RESULTS, VERSION_TWO]
    pageState.index = 0
    pageState.isBatchOn = true
    moveByVersions(1)
    expect(pageState.index).toBe(0)
}

function validateBatchOffReturnsEachControlToItsNormalState() {
    // Step: one version only, no file open, no env key and no typed key.
    const elements = installFakeDom(false)
    installStubEditors(NORMAL_STATE_TEXT)
    pageState.versions = [VERSION_WITH_RESULTS]
    applyBatchMode(true)
    applyBatchMode(false)
    // Step: delete stays off at one version, reset stays off without a file, submit follows the key rule.
    expect(elements.deleteVersionButton.disabled).toBe(true)
    expect(elements.resetButton.disabled).toBe(true)
    expect(elements.prevVersionButton.disabled).toBe(true)
    expect(elements.submitButton.disabled).toBe(true)
    expect(elements.submitButton.textContent).toBe('Submit (paid)')
    expect(listEnabled(elements, ['newButton', 'openButton', 'saveButton', 'reportButton', 'resetRunsButton', 'stateNotesButton', 'questionsNotesButton', 'pinButton'])).toEqual(['newButton', 'openButton', 'saveButton', 'reportButton', 'resetRunsButton', 'stateNotesButton', 'questionsNotesButton', 'pinButton'])
    expect(elements.noteText.disabled).toBe(false)
}

function validateRunsDisableEverythingIncludingTheToggleAndShowProgress() {
    // Step: a run is active on item 2 of 5 and batch is off.
    const elements = installFakeDom(true)
    installStubEditors(NORMAL_STATE_TEXT)
    pageState.versions = [VERSION_WITH_RESULTS, VERSION_TWO]
    pageState.batchRun = { item: 2, count: 5 }
    refreshBatchControls()
    // Step: all listed controls, the toggle and the submit button are disabled, the button shows the progress.
    expect(listEnabled(elements, BATCH_ON_DISABLED_IDS)).toEqual([])
    expect(elements.batchCheckbox.disabled).toBe(true)
    expect(elements.submitButton.disabled).toBe(true)
    expect(elements.submitButton.textContent).toBe('running 2 of 5')
    // Step: the run ends and everything returns to normal.
    pageState.batchRun = null
    refreshBatchControls()
    expect(elements.batchCheckbox.disabled).toBe(false)
    expect(elements.submitButton.disabled).toBe(false)
    expect(elements.submitButton.textContent).toBe('Submit (paid)')
    expect(elements.saveButton.disabled).toBe(false)
}

function validateToggleSendsTheRelintEffectToBothEditors() {
    installFakeDom(true)
    installStubEditors(NORMAL_STATE_TEXT)
    pageState.versions = [VERSION_WITH_RESULTS]
    applyBatchMode(true)
    expect(dispatchedSpecs.length).toBe(2)
    applyBatchMode(false)
    expect(dispatchedSpecs.length).toBe(4)
}

test('test_submit_text_follows_the_mode_and_the_run_progress', validateSubmitTextFollowsTheModeAndTheRunProgress)
test('test_batch_on_disables_every_listed_control_and_keeps_submit_usable', validateBatchOnDisablesEveryListedControlAndKeepsSubmitUsable)
test('test_batch_on_stops_the_arrow_keys_from_moving', validateBatchOnStopsTheArrowKeysFromMoving)
test('test_batch_off_returns_each_control_to_its_normal_state', validateBatchOffReturnsEachControlToItsNormalState)
test('test_runs_disable_everything_including_the_toggle_and_show_progress', validateRunsDisableEverythingIncludingTheToggleAndShowProgress)
test('test_toggle_sends_the_relint_effect_to_both_editors', validateToggleSendsTheRelintEffectToBothEditors)
