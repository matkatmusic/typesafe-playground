import { test, expect, afterEach, mock, spyOn } from 'bun:test'
import type { EditorView } from '@codemirror/view'
import * as editors from './editors'
import * as graphs from './graphs'
import * as noteBox from './noteBox'
import * as winnersDom from './winnersDom'
import { pageState } from './state'
import * as versionArrows from './versionArrows'
import { moveOnArrowKey } from './versionBox'

const ISO_TIME = '2026-03-04T05:06:07.000Z'

class StubElement {
    constructor(private readonly isInside: boolean) {}
    closest() {
        return this.isInside ? this : null
    }
}

function installFakeDom() {
    const elements: Record<string, { textContent: string }> = {
        versionLabel: { textContent: '' }, costLabel: { textContent: '' }, tokensLabel: { textContent: '' }, lastEditedLabel: { textContent: '' },
        graphContainerBox: { textContent: '' }, winnerBox: { textContent: '' },
    }
    spyOn(versionArrows, 'updateVersionArrows').mockImplementation(() => {})
    spyOn(noteBox, 'applyNoteBox').mockImplementation(() => {})
    Object.assign(globalThis, { document: { getElementById: (id: string) => elements[id] ?? null } })
}

function buildStubStateEditor(text: string) {
    return { state: { doc: { toString: () => text } } } as unknown as EditorView
}

function makeVersion(id: number, state: unknown) {
    return { id: id, time: ISO_TIME, state: state, questions: {}, calls: id, outputs: [] }
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

function validateArrowKeyMovesOnlyOutsideTypingTargets() {
    installFakeDom()
    Object.assign(globalThis, { Element: StubElement })
    spyOn(editors, 'renderStateJson').mockImplementation(() => {})
    spyOn(editors, 'renderResultJson').mockImplementation(() => {})
    spyOn(graphs, 'renderGraphs').mockImplementation(() => {})
    spyOn(winnersDom, 'renderWinners').mockImplementation(() => {})
    spyOn(editors, 'getStateEditor').mockReturnValue(buildStubStateEditor('{"a":1}'))
    spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildStubStateEditor('{}'))
    spyOn(editors, 'renderQuestionsJson').mockImplementation(() => {})
    pageState.versions = [makeVersion(1, { a: 1 }), makeVersion(2, { b: 2 })]
    pageState.index = 0
    moveOnArrowKey({ key: 'ArrowRight', target: new StubElement(true) } as unknown as KeyboardEvent)
    expect(pageState.index).toBe(0)
    moveOnArrowKey({ key: 'ArrowUp', target: new StubElement(false) } as unknown as KeyboardEvent)
    expect(pageState.index).toBe(0)
    moveOnArrowKey({ key: 'ArrowRight', target: new StubElement(false) } as unknown as KeyboardEvent)
    expect(pageState.index).toBe(1)
}

test('test_arrow_key_moves_only_outside_typing_targets', validateArrowKeyMovesOnlyOutsideTypingTargets)
