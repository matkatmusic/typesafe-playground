import { test, expect, afterEach, spyOn } from 'bun:test'
import type { EditorView } from '@codemirror/view'
import * as editors from './editors'
import { executeSubmit, SUBMIT_TEXT } from './submit'

class FakeButton { disabled = false; textContent = SUBMIT_TEXT }
class FakeBox { textContent = '' }

const realFetch = globalThis.fetch

function installFakeDom() {
    const elements = { errorLine: new FakeBox(), submitButton: new FakeButton() }
    function getElementById(id: string) {
        return (elements as Record<string, unknown>)[id] ?? null
    }
    Object.assign(globalThis, { document: { getElementById }, HTMLButtonElement: FakeButton })
    return elements
}

function removeFakeDom() {
    Reflect.deleteProperty(globalThis, 'document')
    Reflect.deleteProperty(globalThis, 'HTMLButtonElement')
    globalThis.fetch = realFetch
}

afterEach(removeFakeDom)

function buildStubEditor(text: string) {
    return { state: { doc: { toString: () => text } } } as unknown as EditorView
}

async function validateInvalidQuestionsShowTheErrorAndSendNothing() {
    const elements = installFakeDom()
    const stateSpy = spyOn(editors, 'getStateEditor').mockReturnValue(buildStubEditor('{"a":1}'))
    const questionsSpy = spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildStubEditor('{"q":'))
    const lockSpy = spyOn(editors, 'setEditorLocked').mockImplementation(() => {})
    let fetchCount = 0
    async function stubFetch() {
        fetchCount += 1
        return new Response('{}')
    }
    globalThis.fetch = stubFetch as unknown as typeof fetch
    await executeSubmit()
    stateSpy.mockRestore()
    questionsSpy.mockRestore()
    expect(elements.errorLine.textContent.startsWith('questions is not valid JSON: ')).toBe(true)
    expect(elements.submitButton.disabled).toBe(false)
    expect(elements.submitButton.textContent).toBe(SUBMIT_TEXT)
    expect(lockSpy).not.toHaveBeenCalled()
    lockSpy.mockRestore()
    expect(fetchCount).toBe(0)
}

test('test_invalid_questions_show_the_error_and_send_nothing', validateInvalidQuestionsShowTheErrorAndSendNothing)
