import { test, expect, afterEach, spyOn } from 'bun:test'
import type { EditorView } from '@codemirror/view'
import * as editors from './editors'
import { pageState } from './state'
import { computeArrowStep, isTypingTarget, moveByVersions, moveOnArrowKey, renderLastVersion, updateOnEditorChange } from './versionBox'

class StubElement {
    seenSelector = ''
    constructor(private readonly isInside: boolean) {}
    closest(selector: string) {
        this.seenSelector = selector
        return this.isInside ? this : null
    }
}

function installFakeDom() {
    const elements: Record<string, { textContent: string }> = {
        versionLabel: { textContent: '' }, costLabel: { textContent: '' }, tokensLabel: { textContent: '' },
    }
    Object.assign(globalThis, { document: { getElementById: (id: string) => elements[id] ?? null } })
    return elements
}

function buildStubStateEditor(text: string) {
    return { state: { doc: { toString: () => text } } } as unknown as EditorView
}

function makeVersion(id: number, state: unknown) {
    return { id: id, time: `t${id}`, state: state, questions: {}, calls: id, outputs: [] }
}

function removeFakeState() {
    Reflect.deleteProperty(globalThis, 'document')
    Reflect.deleteProperty(globalThis, 'Element')
    pageState.versions = []
    pageState.index = 0
    pageState.isDirty = false
}

afterEach(removeFakeState)

function validateArrowKeysMapToSteps() {
    expect(computeArrowStep('ArrowLeft')).toBe(-1)
    expect(computeArrowStep('ArrowRight')).toBe(1)
    expect(computeArrowStep('ArrowUp')).toBe(0)
}

function validateTypingTargetsAreSkipped() {
    Object.assign(globalThis, { Element: StubElement })
    const idle = new StubElement(false)
    expect(isTypingTarget(new StubElement(true) as unknown as EventTarget)).toBe(true)
    expect(isTypingTarget(idle as unknown as EventTarget)).toBe(false)
    for (const part of ['input', 'textarea', 'select', 'dialog', '.cm-editor'])
        expect(idle.seenSelector.includes(part)).toBe(true)
    expect(() => isTypingTarget(null)).toThrow('keydown target is not an element')
}

function validateEditMarksDirtyButFillDoesNot() {
    const elements = installFakeDom()
    pageState.versions = [makeVersion(1, { a: 1 })]
    const stateSpy = spyOn(editors, 'getStateEditor').mockReturnValue(buildStubStateEditor('{"a":2}'))
    const fillUpdate = { docChanged: true, transactions: [{ annotation: () => true }] }
    updateOnEditorChange(fillUpdate as never)
    expect(pageState.isDirty).toBe(false)
    const typedUpdate = { docChanged: true, transactions: [{ annotation: () => undefined }] }
    updateOnEditorChange(typedUpdate as never)
    stateSpy.mockRestore()
    expect(pageState.isDirty).toBe(true)
    expect(elements.versionLabel.textContent).toBe('version 2 of 2 · not run yet · 0 calls')
}

function validateUpdateWithoutDocChangeDoesNothing() {
    pageState.isDirty = false
    updateOnEditorChange({ docChanged: false, transactions: [] } as never)
    expect(pageState.isDirty).toBe(false)
}

function validateMovingWrapsAndRendersThatVersion() {
    const elements = installFakeDom()
    const shownStates: unknown[] = []
    const shownResults: unknown[] = []
    function recordState(value: unknown) {
        shownStates.push(value)
    }
    function recordResult(value: unknown) {
        shownResults.push(value)
    }
    const stateSpy = spyOn(editors, 'renderStateJson').mockImplementation(recordState)
    const resultSpy = spyOn(editors, 'renderResultJson').mockImplementation(recordResult)
    const editorSpy = spyOn(editors, 'getStateEditor').mockReturnValue(buildStubStateEditor('{"a":1}'))
    pageState.versions = [makeVersion(1, { a: 1 }), makeVersion(2, { b: 2 })]
    pageState.index = 1
    moveByVersions(1)
    expect(pageState.index).toBe(0)
    expect(shownStates).toEqual([{ a: 1 }])
    expect(shownResults).toEqual([[]])
    expect(elements.versionLabel.textContent).toBe('version 1 of 2 · t1 · 1 call')
    expect(elements.tokensLabel.textContent).toBe('Tokens: 0')
    expect(pageState.isDirty).toBe(false)
    moveByVersions(-1)
    expect(pageState.index).toBe(1)
    renderLastVersion()
    expect(pageState.index).toBe(1)
    stateSpy.mockRestore()
    resultSpy.mockRestore()
    editorSpy.mockRestore()
}

function validateArrowKeyMovesOnlyOutsideTypingTargets() {
    installFakeDom()
    Object.assign(globalThis, { Element: StubElement })
    const stateSpy = spyOn(editors, 'renderStateJson').mockImplementation(() => {})
    const resultSpy = spyOn(editors, 'renderResultJson').mockImplementation(() => {})
    const editorSpy = spyOn(editors, 'getStateEditor').mockReturnValue(buildStubStateEditor('{"a":1}'))
    pageState.versions = [makeVersion(1, { a: 1 }), makeVersion(2, { b: 2 })]
    pageState.index = 0
    moveOnArrowKey({ key: 'ArrowRight', target: new StubElement(true) } as unknown as KeyboardEvent)
    expect(pageState.index).toBe(0)
    moveOnArrowKey({ key: 'ArrowUp', target: new StubElement(false) } as unknown as KeyboardEvent)
    expect(pageState.index).toBe(0)
    moveOnArrowKey({ key: 'ArrowRight', target: new StubElement(false) } as unknown as KeyboardEvent)
    expect(pageState.index).toBe(1)
    stateSpy.mockRestore()
    resultSpy.mockRestore()
    editorSpy.mockRestore()
}

test('test_arrow_keys_map_to_steps', validateArrowKeysMapToSteps)
test('test_typing_targets_are_skipped', validateTypingTargetsAreSkipped)
test('test_edit_marks_dirty_but_fill_does_not', validateEditMarksDirtyButFillDoesNot)
test('test_update_without_doc_change_does_nothing', validateUpdateWithoutDocChangeDoesNothing)
test('test_moving_wraps_and_renders_that_version', validateMovingWrapsAndRendersThatVersion)
test('test_arrow_key_moves_only_outside_typing_targets', validateArrowKeyMovesOnlyOutsideTypingTargets)
