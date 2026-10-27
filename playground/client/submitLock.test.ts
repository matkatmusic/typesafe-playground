import { test, expect, afterEach, spyOn } from 'bun:test'
import type { EditorView } from '@codemirror/view'
import type { Version } from '../playgroundHistory'
import * as editors from './editors'
import * as graphs from './graphs'
import * as winnersDom from './winnersDom'
import { pageState } from './state'
import { executeSubmit, listLockableEditors, SUBMIT_TEXT, setEditorsLocked } from './submit'

class FakeButton { disabled = false; textContent = SUBMIT_TEXT }
class FakeInput { value = ''; type = 'password' }
class FakeBox { textContent = '' }

const VERSION = { id: 1, time: '2026-03-04T05:06:07.000Z', state: { a: 1 }, questions: {}, calls: 1, outputs: [] } as unknown as Version
const realFetch = globalThis.fetch

function installFakeDom() {
    const elements = {
        data: new FakeBox(), graphContainerBox: new FakeBox(), winnerBox: new FakeBox(), errorLine: new FakeBox(), costLabel: new FakeBox(), tokensLabel: new FakeBox(), versionLabel: new FakeBox(), lastEditedLabel: new FakeBox(),
        submitButton: new FakeButton(), prevVersionButton: new FakeButton(), nextVersionButton: new FakeButton(), pinButton: new FakeButton(), unpinButton: new FakeButton(), callsPicker: new FakeInput(), typeSafeKeyEditor: new FakeInput(), noteText: new FakeInput(),
    }
    elements.data.textContent = JSON.stringify({ versions: [VERSION], hasEnvKey: true })
    function getElementById(id: string) {
        return (elements as Record<string, unknown>)[id] ?? null
    }
    Object.assign(globalThis, { document: { getElementById }, HTMLButtonElement: FakeButton, HTMLInputElement: FakeInput, HTMLTextAreaElement: FakeInput })
}

function removeFakeDom() {
    Reflect.deleteProperty(globalThis, 'document')
    for (const name of ['HTMLButtonElement', 'HTMLInputElement', 'HTMLTextAreaElement']) Reflect.deleteProperty(globalThis, name)
    globalThis.fetch = realFetch
    pageState.isDirty = false
    pageState.versions = []
    pageState.index = 0
}

afterEach(removeFakeDom)

function buildStubEditor(text: string) {
    return { state: { doc: { toString: () => text } } } as unknown as EditorView
}

function spyOnLockCalls() {
    const lockCalls: boolean[] = []
    const lockedEditors: EditorView[] = []
    function recordLock(editor: EditorView, isLocked: boolean) {
        lockCalls.push(isLocked)
        lockedEditors.push(editor)
    }
    const stateEditor = buildStubEditor('{"a":1}')
    const questionsEditor = buildStubEditor('{"q":1}')
    const lockSpy = spyOn(editors, 'setEditorLocked').mockImplementation(recordLock)
    const stateSpy = spyOn(editors, 'getStateEditor').mockReturnValue(stateEditor)
    const questionsSpy = spyOn(editors, 'getQuestionsEditor').mockReturnValue(questionsEditor)
    const renderStateSpy = spyOn(editors, 'renderStateJson').mockImplementation(() => {})
    const renderQuestionsSpy = spyOn(editors, 'renderQuestionsJson').mockImplementation(() => {})
    const renderResultSpy = spyOn(editors, 'renderResultJson').mockImplementation(() => {})
    const renderGraphsSpy = spyOn(graphs, 'renderGraphs').mockImplementation(() => {})
    const renderWinnersSpy = spyOn(winnersDom, 'renderWinners').mockImplementation(() => {})
    function restoreSpies() {
        lockSpy.mockRestore()
        stateSpy.mockRestore()
        questionsSpy.mockRestore()
        renderStateSpy.mockRestore()
        renderQuestionsSpy.mockRestore()
        renderResultSpy.mockRestore()
        renderGraphsSpy.mockRestore()
        renderWinnersSpy.mockRestore()
    }
    return { lockCalls, lockedEditors, stateEditor, questionsEditor, restoreSpies }
}

async function validateEditorsAreLockedWhileTheRunIsInFlightAndUnlockedAfterSuccess() {
    installFakeDom()
    const { lockCalls, restoreSpies } = spyOnLockCalls()
    pageState.versions = [VERSION]
    let locksWhileRunning: boolean[] = []
    async function stubFetch() {
        locksWhileRunning = [...lockCalls]
        return Response.json({ outputs: [], version: { ...VERSION, id: 2 } })
    }
    globalThis.fetch = stubFetch as unknown as typeof fetch
    await executeSubmit()
    restoreSpies()
    expect(locksWhileRunning).toEqual([true, true])
    expect(lockCalls).toEqual([true, true, false, false])
}

async function validateEditorsAreUnlockedAfterAnErrorResponse() {
    installFakeDom()
    const { lockCalls, restoreSpies } = spyOnLockCalls()
    pageState.versions = [VERSION]
    async function stubFetch() {
        return new Response('boom', { status: 500 })
    }
    globalThis.fetch = stubFetch as unknown as typeof fetch
    await executeSubmit()
    restoreSpies()
    expect(lockCalls).toEqual([true, true, false, false])
}

async function validateEditorsAreUnlockedAfterAThrownFetchErrorAndTheErrorStillThrows() {
    installFakeDom()
    const { lockCalls, restoreSpies } = spyOnLockCalls()
    pageState.versions = [VERSION]
    async function stubFetch() {
        throw new Error('network down')
    }
    globalThis.fetch = stubFetch as unknown as typeof fetch
    const submitPromise = executeSubmit()
    await expect(submitPromise).rejects.toThrow('network down')
    restoreSpies()
    expect(lockCalls).toEqual([true, true, false, false])
}

function validateLockableEditorsHoldTheStateAndQuestionsEditorsAndLockingReachesEachOne() {
    const { lockCalls, lockedEditors, stateEditor, questionsEditor, restoreSpies } = spyOnLockCalls()
    expect(listLockableEditors()).toEqual([stateEditor, questionsEditor])
    setEditorsLocked(true)
    restoreSpies()
    expect(lockCalls).toEqual([true, true])
    expect(lockedEditors).toEqual([stateEditor, questionsEditor])
}

async function validateInvalidStateNeverLocksTheEditors() {
    installFakeDom()
    const { lockCalls, restoreSpies } = spyOnLockCalls()
    const stateSpy = spyOn(editors, 'getStateEditor').mockReturnValue({ state: { doc: { toString: () => '{"a":' } } } as unknown as EditorView)
    await executeSubmit()
    stateSpy.mockRestore()
    restoreSpies()
    expect(lockCalls).toEqual([])
}

test('test_invalid_state_never_locks_the_editors', validateInvalidStateNeverLocksTheEditors)
test('test_editors_are_locked_while_the_run_is_in_flight_and_unlocked_after_success', validateEditorsAreLockedWhileTheRunIsInFlightAndUnlockedAfterSuccess)
test('test_editors_are_unlocked_after_an_error_response', validateEditorsAreUnlockedAfterAnErrorResponse)
test('test_editors_are_unlocked_after_a_thrown_fetch_error_and_the_error_still_throws', validateEditorsAreUnlockedAfterAThrownFetchErrorAndTheErrorStillThrows)
test('test_lockable_editors_hold_the_state_and_questions_editors_and_locking_reaches_each_one', validateLockableEditorsHoldTheStateAndQuestionsEditorsAndLockingReachesEachOne)
