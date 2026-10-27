import { test, expect, afterEach, mock, spyOn } from 'bun:test'
import type { EditorView } from '@codemirror/view'
import * as editors from './editors'
import * as graphs from './graphs'
import { pageState } from './state'
import { isVersionMovePossible, updateVersionArrows } from './versionArrows'
import { moveOnArrowKey, updateOnEditorChange } from './versionBox'

const ISO_TIME = '2026-03-04T05:06:07.000Z'

function installFakeDom() {
    const elements: Record<string, { textContent: string, disabled?: boolean }> = {
        versionLabel: { textContent: '' }, costLabel: { textContent: '' }, tokensLabel: { textContent: '' }, graphContainerBox: { textContent: '' },
        prevVersionButton: { textContent: '', disabled: false }, nextVersionButton: { textContent: '', disabled: false },
    }
    Object.assign(globalThis, { document: { getElementById: (id: string) => elements[id] ?? null }, HTMLButtonElement: Object, Element: Object })
    return elements
}

function buildStubEditor(text: string) {
    return { state: { doc: { toString: () => text } } } as unknown as EditorView
}

function makeVersion(id: number) {
    return { id: id, time: ISO_TIME, state: {}, questions: {}, calls: id, outputs: [] }
}

function installRenderStubs() {
    spyOn(editors, 'renderStateJson').mockImplementation(() => {})
    spyOn(editors, 'renderQuestionsJson').mockImplementation(() => {})
    spyOn(graphs, 'renderGraphs').mockImplementation(() => {})
    spyOn(editors, 'getStateEditor').mockReturnValue(buildStubEditor('{}'))
    return spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildStubEditor('{}'))
}

function removeFakeState() {
    mock.restore()
    Reflect.deleteProperty(globalThis, 'document')
    Reflect.deleteProperty(globalThis, 'HTMLButtonElement')
    Reflect.deleteProperty(globalThis, 'Element')
    pageState.versions = []
    pageState.index = 0
    pageState.isDirty = false
}

afterEach(removeFakeState)

function validateOneVersionDisablesBothButtonsAndTwoEnablesThem() {
    const elements = installFakeDom()
    pageState.versions = [makeVersion(1)]
    updateVersionArrows()
    expect(isVersionMovePossible()).toBe(false)
    expect(elements.prevVersionButton.disabled).toBe(true)
    expect(elements.nextVersionButton.disabled).toBe(true)
    pageState.versions = [makeVersion(1), makeVersion(2)]
    updateVersionArrows()
    expect(isVersionMovePossible()).toBe(true)
    expect(elements.prevVersionButton.disabled).toBe(false)
    expect(elements.nextVersionButton.disabled).toBe(false)
}

function validateArrowKeysDoNothingWithOneVersion() {
    installFakeDom()
    const renderSpy = installRenderStubs()
    pageState.versions = [makeVersion(1)]
    moveOnArrowKey({ key: 'ArrowRight', target: { closest: () => null } } as unknown as KeyboardEvent)
    moveOnArrowKey({ key: 'ArrowLeft', target: { closest: () => null } } as unknown as KeyboardEvent)
    expect(pageState.index).toBe(0)
    expect(renderSpy.mock.calls.length).toBe(0)
}

function validateArrowKeysMoveAndEnableButtonsWithTwoVersions() {
    const elements = installFakeDom()
    installRenderStubs()
    elements.prevVersionButton.disabled = true
    elements.nextVersionButton.disabled = true
    pageState.versions = [makeVersion(1), makeVersion(2)]
    moveOnArrowKey({ key: 'ArrowRight', target: { closest: () => null } } as unknown as KeyboardEvent)
    expect(pageState.index).toBe(1)
    expect(elements.prevVersionButton.disabled).toBe(false)
    expect(elements.nextVersionButton.disabled).toBe(false)
}

function validateUpdateWithoutDocChangeDoesNothing() {
    pageState.isDirty = false
    updateOnEditorChange({ docChanged: false, transactions: [] } as never)
    expect(pageState.isDirty).toBe(false)
}

test('test_one_version_disables_both_buttons_and_two_enables_them', validateOneVersionDisablesBothButtonsAndTwoEnablesThem)
test('test_arrow_keys_do_nothing_with_one_version', validateArrowKeysDoNothingWithOneVersion)
test('test_arrow_keys_move_and_enable_buttons_with_two_versions', validateArrowKeysMoveAndEnableButtonsWithTwoVersions)
test('test_update_without_doc_change_does_nothing', validateUpdateWithoutDocChangeDoesNothing)
