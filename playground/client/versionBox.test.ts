import { test, expect, afterEach, mock, spyOn } from 'bun:test'
import type { EditorView } from '@codemirror/view'
import * as editors from './editors'
import * as graphs from './graphs'
import * as noteBox from './noteBox'
import * as pinButtons from './pinButtons'
import * as winnersDom from './winnersDom'
import { pageState } from './state'
import * as versionArrows from './versionArrows'
import { computeArrowStep, isTypingTarget, moveByVersions, renderLastVersion, updateOnEditorChange } from './versionBox'

const ISO_TIME = '2026-03-04T05:06:07.000Z'

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
        versionLabel: { textContent: '' }, costLabel: { textContent: '' }, tokensLabel: { textContent: '' }, lastEditedLabel: { textContent: '' },
        graphContainerBox: { textContent: '' }, winnerBox: { textContent: '' },
    }
    spyOn(versionArrows, 'updateVersionArrows').mockImplementation(() => {})
    spyOn(pinButtons, 'applyPinButtons').mockImplementation(() => {})
    spyOn(noteBox, 'applyNoteBox').mockImplementation(() => {})
    Object.assign(globalThis, { document: { getElementById: (id: string) => elements[id] ?? null } })
    return elements
}

function buildStubStateEditor(text: string) {
    return { state: { doc: { toString: () => text } } } as unknown as EditorView
}

function makeVersion(id: number, state: unknown) {
    return { id: id, time: ISO_TIME, state: state, questions: {}, calls: id, outputs: [] }
}

function installQuestionsStub(questionsText: string) {
    spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildStubStateEditor(questionsText))
    return spyOn(editors, 'renderQuestionsJson').mockImplementation(() => {})
}

function removeFakeState() {
    mock.restore()
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
    installQuestionsStub('{}')
    spyOn(editors, 'getStateEditor').mockReturnValue(buildStubStateEditor('{"a":2}'))
    const fillUpdate = { docChanged: true, transactions: [{ annotation: () => true }] }
    updateOnEditorChange(fillUpdate as never)
    expect(pageState.isDirty).toBe(false)
    expect(elements.lastEditedLabel.textContent).toBe('')
    const typedUpdate = { docChanged: true, transactions: [{ annotation: () => undefined }] }
    updateOnEditorChange(typedUpdate as never)
    expect(pageState.isDirty).toBe(true)
    expect(elements.lastEditedLabel.textContent.startsWith('last edited: ')).toBe(true)
    expect(elements.versionLabel.textContent).toBe('version 2 of 2 · not run yet · 0 calls')
}

function validateQuestionsOnlyChangeShowsTheNextVersionAsNotRunYet() {
    const elements = installFakeDom()
    pageState.versions = [makeVersion(1, { a: 1 })]
    spyOn(editors, 'getStateEditor').mockReturnValue(buildStubStateEditor('{"a":1}'))
    installQuestionsStub('{"q":1}')
    updateOnEditorChange({ docChanged: true, transactions: [] } as never)
    expect(elements.versionLabel.textContent).toBe('version 2 of 2 · not run yet · 0 calls')
}

function validateMovingWrapsAndRendersThatVersion() {
    const elements = installFakeDom()
    const shownStates: unknown[] = []
    const shownResults: unknown[] = []
    const shownGraphOutputs: unknown[] = []
    let stateText = '{"b":2}'
    function recordState(value: unknown) {
        shownStates.push(value)
        stateText = JSON.stringify(value)
    }
    function recordResult(value: unknown) {
        shownResults.push(value)
    }
    function recordGraphs(version: { outputs: unknown[] }) {
        shownGraphOutputs.push(version.outputs)
    }
    spyOn(editors, 'renderStateJson').mockImplementation(recordState)
    spyOn(editors, 'renderResultJson').mockImplementation(recordResult)
    spyOn(graphs, 'renderGraphs').mockImplementation(recordGraphs as never)
    spyOn(winnersDom, 'renderWinners').mockImplementation(() => {})
    spyOn(editors, 'getStateEditor').mockReturnValue({ state: { doc: { toString: () => stateText } } } as unknown as EditorView)
    const renderQuestionsSpy = installQuestionsStub('{}')
    pageState.versions = [makeVersion(1, { a: 1 }), makeVersion(2, { b: 2 })]
    pageState.index = 1
    moveByVersions(1)
    expect(pageState.index).toBe(0)
    expect(shownStates).toEqual([{ a: 1 }])
    expect(renderQuestionsSpy.mock.calls).toEqual([[{}]])
    expect(shownResults).toEqual([[]])
    expect(shownGraphOutputs).toEqual([[]])
    expect(elements.versionLabel.textContent).toBe(`version 1 of 2 · ${new Date(ISO_TIME).toLocaleString()} · 1 call`)
    expect(elements.tokensLabel.textContent).toBe('Tokens: 0')
    expect(pageState.isDirty).toBe(false)
    moveByVersions(-1)
    expect(pageState.index).toBe(1)
    renderLastVersion()
    expect(pageState.index).toBe(1)
}

test('test_arrow_keys_map_to_steps', validateArrowKeysMapToSteps)
test('test_typing_targets_are_skipped', validateTypingTargetsAreSkipped)
test('test_edit_marks_dirty_but_fill_does_not', validateEditMarksDirtyButFillDoesNot)
test('test_questions_only_change_shows_the_next_version_as_not_run_yet', validateQuestionsOnlyChangeShowsTheNextVersionAsNotRunYet)
test('test_moving_wraps_and_renders_that_version', validateMovingWrapsAndRendersThatVersion)
