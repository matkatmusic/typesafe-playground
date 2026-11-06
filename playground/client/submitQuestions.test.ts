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

async function runBlockedSubmit(stateText: string, questionsText: string) {
    const elements = installFakeDom()
    const stateSpy = spyOn(editors, 'getStateEditor').mockReturnValue(buildStubEditor(stateText))
    const questionsSpy = spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildStubEditor(questionsText))
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
    const isLockCalled = lockSpy.mock.calls.length > 0
    lockSpy.mockRestore()
    return { elements, fetchCount, isLockCalled }
}

async function validateWrongQuestionTypeShowsTheErrorAndSendsNothing() {
    // Step: the questions text parses as JSON, but the question type is not a TypeSafe type.
    const result = await runBlockedSubmit('{"a":1}', '{"q":{"type":"wrong"}}')
    // Step: the error line names the bad type, and no run starts.
    expect(result.elements.errorLine.textContent).toBe('q.type must be noul, choice, score or box')
    expect(result.elements.submitButton.disabled).toBe(false)
    expect(result.isLockCalled).toBe(false)
    expect(result.fetchCount).toBe(0)
}

async function validateNameFromAnotherQuestionShowsTheErrorAndSendsNothing() {
    // Step: secretWord is only in ownName's own object; crossName uses it too.
    const questionsText = '{"ownName":{"type":"noul","instructions":{"task":"Is `secretWord` the word banana?","secretWord":"banana"}},"crossName":{"type":"noul","instructions":"Is `secretWord` the word banana?"}}'
    const result = await runBlockedSubmit('{"fruit":"apple"}', questionsText)
    // Step: only crossName is reported, and no run starts.
    expect(result.elements.errorLine.textContent).toBe('crossName: `secretWord` is not in state or in this question')
    expect(result.elements.submitButton.disabled).toBe(false)
    expect(result.isLockCalled).toBe(false)
    expect(result.fetchCount).toBe(0)
}

test('test_invalid_questions_show_the_error_and_send_nothing', validateInvalidQuestionsShowTheErrorAndSendNothing)
test('test_wrong_question_type_shows_the_error_and_sends_nothing', validateWrongQuestionTypeShowsTheErrorAndSendsNothing)
test('test_name_from_another_question_shows_the_error_and_sends_nothing', validateNameFromAnotherQuestionShowsTheErrorAndSendsNothing)
