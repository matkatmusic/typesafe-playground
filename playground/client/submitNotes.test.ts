import { test, expect, afterEach, mock, spyOn } from 'bun:test'
import type { EditorView } from '@codemirror/view'
import type { Version } from '../playgroundHistory'
import * as editors from './editors'
import * as saveVersionNote from './saveVersionNote'
import { pageState } from './state'
import { executeSubmit } from './submit'
import * as versionBox from './versionBox'

class FakeButton { disabled = false; textContent = '' }
class FakeInput { value = ''; type = 'password' }
class FakeBox { textContent = '' }

const realFetch = globalThis.fetch

function buildVersion(stateNote: string | undefined): Version {
    // return { time: 't', state: { a: 1 }, questions: {}, calls: 1, outputs: [], stateNote: stateNote, questionsNote: stateNote && 'questions of ' + stateNote }
    return { time: 't', state: { a: 1 }, questions: { q: { type: 'noul' } }, calls: 1, outputs: [], stateNote: stateNote, questionsNote: stateNote && 'questions of ' + stateNote }
}

function buildStubEditor(text: string) {
    return { state: { doc: { toString: () => text } }, dispatch: () => {} } as unknown as EditorView
}

function installFakeDom() {
    const data = new FakeBox()
    data.textContent = JSON.stringify({ versions: [], hasEnvKey: true })
    const elements = { data: data, errorLine: new FakeBox(), lastEditedLabel: new FakeBox(), deleteVersionButton: new FakeButton(), submitButton: new FakeButton(), callsPicker: new FakeInput(), typeSafeKeyEditor: new FakeInput() }
    function getElementById(id: string) {
        return (elements as Record<string, unknown>)[id] ?? null
    }
    Object.assign(globalThis, { document: { getElementById }, HTMLButtonElement: FakeButton, HTMLInputElement: FakeInput })
}

function installSubmit(stateText: string, questionsText: string, resultVersion: Version, resultIndex: number) {
    installFakeDom()
    spyOn(editors, 'getStateEditor').mockReturnValue(buildStubEditor(stateText))
    spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildStubEditor(questionsText))
    spyOn(editors, 'setEditorLocked').mockImplementation(() => {})
    spyOn(versionBox, 'renderShownVersion').mockImplementation(() => {})
    const saveSpy = spyOn(saveVersionNote, 'saveInheritedNote').mockResolvedValue(undefined)
    globalThis.fetch = (async () => Response.json({ outputs: [], version: resultVersion, index: resultIndex })) as unknown as typeof fetch
    return saveSpy
}

afterEach(removeFakeState)

function removeFakeState() {
    mock.restore()
    for (const name of ['document', 'HTMLButtonElement', 'HTMLInputElement']) Reflect.deleteProperty(globalThis, name)
    globalThis.fetch = realFetch
    pageState.isDirty = false
    pageState.versions = []
    pageState.index = 0
}

async function validateAChangedQuestionsTextIsReportedAsChanged() {
    const created = buildVersion(undefined)
    // const saveSpy = installSubmit('{"a":1}', '{"q":2}', created, 1)
    const saveSpy = installSubmit('{"a":1}', '{"r":{"type":"noul"}}', created, 1)
    pageState.versions = [buildVersion('base note')]
    await executeSubmit()
    expect(saveSpy).toHaveBeenCalledWith('state', 'base note', true, created)
    expect(saveSpy).toHaveBeenCalledWith('questions', 'questions of base note', false, created)
}

async function validateAChangedStateIsReportedAsChanged() {
    const created = buildVersion(undefined)
    // const saveSpy = installSubmit('{"a":2}', '{}', created, 1)
    const saveSpy = installSubmit('{"a":2}', '{"q":{"type":"noul"}}', created, 1)
    pageState.versions = [buildVersion('base note')]
    await executeSubmit()
    expect(saveSpy).toHaveBeenCalledWith('state', 'base note', false, created)
    expect(saveSpy).toHaveBeenCalledWith('questions', 'questions of base note', true, created)
}

async function validateARunOnTheSameVersionLeavesTheNotesAlone() {
    const base = buildVersion('base note')
    // const saveSpy = installSubmit('{"a":1}', '{}', base, 0)
    const saveSpy = installSubmit('{"a":1}', '{"q":{"type":"noul"}}', base, 0)
    pageState.versions = [base]
    await executeSubmit()
    expect(saveSpy).not.toHaveBeenCalled()
}

test('test_a_changed_questions_text_is_reported_as_changed', validateAChangedQuestionsTextIsReportedAsChanged)
test('test_a_changed_state_is_reported_as_changed', validateAChangedStateIsReportedAsChanged)
test('test_a_run_on_the_same_version_leaves_the_notes_alone', validateARunOnTheSameVersionLeavesTheNotesAlone)
