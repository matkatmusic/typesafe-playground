import { test, expect, afterEach, mock, spyOn } from 'bun:test'
import type { EditorView } from '@codemirror/view'
import * as editors from './editors'
import * as graphs from './graphs'
import * as noteBox from './noteBox'
import * as pinButtons from './pinButtons'
import { pageState } from './state'
import { executeSubmit } from './submit'
import { updateVersionArrows } from './versionArrows'
import { moveToNextVersion, moveToPreviousVersion } from './versionBox'
import * as winnersDom from './winnersDom'

class FakeButton { disabled = false; textContent = '' }
class FakeInput { value = ''; type = 'password' }
class FakeBox { textContent = '' }

const ISO_TIME = '2026-03-04T05:06:07.000Z'
const VERSION = { id: 1, time: ISO_TIME, state: { a: 1 }, questions: { q: 1 }, calls: 1, outputs: [] }
const realFetch = globalThis.fetch

afterEach(() => {
    mock.restore()
    for (const name of ['document', 'HTMLButtonElement', 'HTMLInputElement', 'HTMLTextAreaElement'])
        Reflect.deleteProperty(globalThis, name)
    globalThis.fetch = realFetch
    pageState.versions = []
    pageState.index = 0
    pageState.isDirty = false
    pageState.editedDraft = null
})

function installOneVersionWithAnEditedState() {
    const elements = {
        data: new FakeBox(), versionLabel: new FakeBox(), costLabel: new FakeBox(), tokensLabel: new FakeBox(), graphContainerBox: new FakeBox(), winnerBox: new FakeBox(), lastEditedLabel: new FakeBox(), errorLine: new FakeBox(),
        prevVersionButton: new FakeButton(), nextVersionButton: new FakeButton(), submitButton: new FakeButton(), callsPicker: new FakeInput(), typeSafeKeyEditor: new FakeInput(),
    }
    elements.data.textContent = JSON.stringify({ versions: [], hasEnvKey: true })
    elements.callsPicker.value = '1'
    elements.typeSafeKeyEditor.value = 'key'
    const getElementById = (id: string) => (elements as Record<string, unknown>)[id] ?? null
    Object.assign(globalThis, { document: { getElementById }, HTMLButtonElement: FakeButton, HTMLInputElement: FakeInput, HTMLTextAreaElement: FakeInput })
    const texts = { state: '{"a": 2}', questions: '{"q": 1}' }
    const stateEditor = { state: { doc: { toString: () => texts.state } }, dispatch: () => {} } as unknown as EditorView
    const questionsEditor = { state: { doc: { toString: () => texts.questions } }, dispatch: () => {} } as unknown as EditorView
    spyOn(editors, 'getStateEditor').mockReturnValue(stateEditor)
    spyOn(editors, 'getQuestionsEditor').mockReturnValue(questionsEditor)
    spyOn(editors, 'renderStateJson').mockImplementation((value) => { texts.state = JSON.stringify(value) })
    spyOn(editors, 'renderQuestionsJson').mockImplementation((value) => { texts.questions = JSON.stringify(value) })
    spyOn(editors, 'fillEditorText').mockImplementation((editor, text) => {
        if (editor === stateEditor)
            texts.state = text
        else
            texts.questions = text
    })
    spyOn(editors, 'renderResultJson').mockImplementation(() => {})
    spyOn(editors, 'setEditorLocked').mockImplementation(() => {})
    spyOn(graphs, 'renderGraphs').mockImplementation(() => {})
    spyOn(winnersDom, 'renderWinners').mockImplementation(() => {})
    spyOn(noteBox, 'applyNoteBox').mockImplementation(() => {})
    spyOn(pinButtons, 'applyPinButtons').mockImplementation(() => {})
    pageState.versions = [VERSION]
    pageState.index = 0
    return { elements, texts }
}

function validateOneVersionPlusAnEditKeepsTheArrowsEnabledAndBothStopsReachable() {
    const { elements, texts } = installOneVersionWithAnEditedState()
    updateVersionArrows()
    expect(elements.prevVersionButton.disabled).toBe(false)
    expect(elements.nextVersionButton.disabled).toBe(false)
    moveToPreviousVersion()
    expect(pageState.index).toBe(0)
    expect(elements.versionLabel.textContent).toBe(`version 1 of 2 · ${new Date(ISO_TIME).toLocaleString()} · 1 call`)
    expect(texts.state).toBe('{"a":1}')
    expect(elements.prevVersionButton.disabled).toBe(false)
    moveToNextVersion()
    expect(pageState.index).toBe(0)
    expect(elements.versionLabel.textContent).toBe('version 2 of 2 · not run yet · 0 calls')
    expect(texts.state).toBe('{"a": 2}')
}

async function validateARunClearsTheKeptDraft() {
    const { elements } = installOneVersionWithAnEditedState()
    moveToPreviousVersion()
    expect(pageState.editedDraft).toEqual({ state: '{"a": 2}', questions: '{"q": 1}', baseIndex: 0 })
    globalThis.fetch = (async () => Response.json({ outputs: [], version: { ...VERSION, id: 2 } })) as unknown as typeof fetch
    await executeSubmit()
    expect(pageState.editedDraft).toBeNull()
    expect(pageState.versions.length).toBe(2)
    expect(elements.errorLine.textContent).toBe('')
}

test('test_one_version_plus_an_edit_keeps_the_arrows_enabled_and_both_stops_reachable', validateOneVersionPlusAnEditKeepsTheArrowsEnabledAndBothStopsReachable)
test('test_a_run_clears_the_kept_draft', validateARunClearsTheKeptDraft)
