import { test, expect, afterEach, spyOn } from 'bun:test'
import type { EditorView } from '@codemirror/view'
import type { Version } from '../playgroundHistory'
import * as editors from './editors'
import { pageState } from './state'
import { buildRunBody, executeSubmit, formatRunFailure, RUNNING_TEXT, SUBMIT_TEXT } from './submit'

class FakeButton { disabled = false; textContent = SUBMIT_TEXT }
class FakeInput { value = ''; type = 'password' }
class FakeBox { textContent = '' }

const VERSION = { id: 1, time: 't', state: { a: 1 }, questions: {}, calls: 1, outputs: [{ usage: { input_tokens: 1000000, output_tokens: 1 } }] } as unknown as Version
const realFetch = globalThis.fetch

function installFakeDom(hasEnvKey: boolean) {
    const elements = {
        data: new FakeBox(), errorLine: new FakeBox(), costLabel: new FakeBox(), tokensLabel: new FakeBox(), versionLabel: new FakeBox(), lastEditedLabel: new FakeBox(),
        submitButton: new FakeButton(), callsPicker: new FakeInput(), typeSafeKeyEditor: new FakeInput(),
    }
    elements.data.textContent = JSON.stringify({ versions: [VERSION], hasEnvKey })
    function getElementById(id: string) {
        return (elements as Record<string, unknown>)[id] ?? null
    }
    Object.assign(globalThis, { document: { getElementById }, HTMLButtonElement: FakeButton, HTMLInputElement: FakeInput })
    return elements
}

function removeFakeDom() {
    Reflect.deleteProperty(globalThis, 'document')
    Reflect.deleteProperty(globalThis, 'HTMLButtonElement')
    Reflect.deleteProperty(globalThis, 'HTMLInputElement')
    globalThis.fetch = realFetch
    pageState.isDirty = false
    pageState.versions = []
    pageState.index = 0
}

afterEach(removeFakeDom)

function buildStubStateEditor(text: string) {
    return { state: { doc: { toString: () => text } } } as unknown as EditorView
}

function validateRunBodyHoldsCallsTheTrimmedTypedKeyAndTheState() {
    const elements = installFakeDom(true)
    elements.callsPicker.value = '3'
    elements.typeSafeKeyEditor.value = ' typed '
    pageState.versions = [VERSION, { ...VERSION, id: 2 }]
    pageState.index = 1
    expect(buildRunBody({ a: 1 })).toEqual({ id: 2, calls: 3, apiKey: 'typed', state: { a: 1 } })
}

function validateRunFailureNamesTheStatusAndText() {
    expect(formatRunFailure(500, 'boom')).toBe('Run failed: 500 boom')
}

async function validateSubmitPostsRunAndShowsTheOutputsAndLabels() {
    const elements = installFakeDom(true)
    const shownValues: unknown[] = []
    function recordShownValue(value: unknown) {
        shownValues.push(value)
    }
    const renderSpy = spyOn(editors, 'renderResultJson').mockImplementation(recordShownValue)
    const renderStateSpy = spyOn(editors, 'renderStateJson').mockImplementation(recordShownValue)
    const stateSpy = spyOn(editors, 'getStateEditor').mockReturnValue(buildStubStateEditor('{"a":1}'))
    const newVersion = { ...VERSION, id: 2 }
    pageState.versions = [VERSION]
    pageState.index = 0
    let seenBody = ''
    let wasDisabledWhileRunning = false
    let textWhileRunning = ''
    async function stubFetch(_path: string, init?: RequestInit) {
        wasDisabledWhileRunning = elements.submitButton.disabled
        textWhileRunning = elements.submitButton.textContent
        seenBody = String(init?.body)
        return Response.json({ outputs: VERSION.outputs, version: newVersion })
    }
    globalThis.fetch = stubFetch as unknown as typeof fetch
    elements.callsPicker.value = '3'
    pageState.isDirty = false
    await executeSubmit()
    renderSpy.mockRestore()
    renderStateSpy.mockRestore()
    stateSpy.mockRestore()
    expect(JSON.parse(seenBody)).toEqual({ id: 1, calls: 3, apiKey: '', state: { a: 1 } })
    expect(wasDisabledWhileRunning).toBe(true)
    expect(textWhileRunning).toBe(RUNNING_TEXT)
    expect(elements.submitButton.disabled).toBe(false)
    expect(elements.submitButton.textContent).toBe(SUBMIT_TEXT)
    expect(elements.costLabel.textContent).toBe('Cost: $0.042000')
    expect(elements.tokensLabel.textContent).toBe('Tokens: 1000000')
    expect(shownValues).toEqual([VERSION.state, VERSION.outputs])
    expect(elements.errorLine.textContent).toBe('')
    expect(pageState.isDirty).toBe(true)
    expect(elements.lastEditedLabel.textContent.startsWith('last edited: ')).toBe(true)
    expect(pageState.versions.length).toBe(2)
    expect(pageState.versions[1]).toEqual(newVersion)
    expect(pageState.index).toBe(1)
    expect(elements.versionLabel.textContent).toBe('version 2 of 2 · t · 1 call')
}

async function validateFailedSubmitShowsTheErrorLineAndLeavesTheResultAlone() {
    const elements = installFakeDom(true)
    const renderSpy = spyOn(editors, 'renderResultJson')
    const stateSpy = spyOn(editors, 'getStateEditor').mockReturnValue(buildStubStateEditor('{}'))
    pageState.versions = [VERSION]
    async function stubFetch() {
        return new Response('boom', { status: 500 })
    }
    globalThis.fetch = stubFetch as unknown as typeof fetch
    await executeSubmit()
    expect(elements.errorLine.textContent).toBe('Run failed: 500 boom')
    expect(elements.submitButton.disabled).toBe(false)
    expect(elements.submitButton.textContent).toBe(SUBMIT_TEXT)
    expect(renderSpy).not.toHaveBeenCalled()
    renderSpy.mockRestore()
    stateSpy.mockRestore()
}

async function validateInvalidStateShowsTheErrorAndSendsNothing() {
    const elements = installFakeDom(true)
    const stateSpy = spyOn(editors, 'getStateEditor').mockReturnValue(buildStubStateEditor('{"a":'))
    let fetchCount = 0
    async function stubFetch() {
        fetchCount += 1
        return new Response('{}')
    }
    globalThis.fetch = stubFetch as unknown as typeof fetch
    await executeSubmit()
    stateSpy.mockRestore()
    expect(elements.errorLine.textContent.startsWith('state is not valid JSON: ')).toBe(true)
    expect(elements.submitButton.disabled).toBe(false)
    expect(fetchCount).toBe(0)
}

test('test_run_body_holds_calls_the_trimmed_typed_key_and_the_state', validateRunBodyHoldsCallsTheTrimmedTypedKeyAndTheState)
test('test_invalid_state_shows_the_error_and_sends_nothing', validateInvalidStateShowsTheErrorAndSendsNothing)
test('test_run_failure_names_the_status_and_text', validateRunFailureNamesTheStatusAndText)
test('test_submit_posts_run_and_shows_the_outputs_and_labels', validateSubmitPostsRunAndShowsTheOutputsAndLabels)
test('test_failed_submit_shows_the_error_line_and_leaves_the_result_alone', validateFailedSubmitShowsTheErrorLineAndLeavesTheResultAlone)
