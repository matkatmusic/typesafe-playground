import { test, expect, afterEach } from 'bun:test'
import type { ViewUpdate } from '@codemirror/view'
import { computeJsonParseResult } from './jsonParse'
import { clearStateJsonError, STATE_ERROR_PREFIX } from './stateErrorClear'

class FakeBox { textContent = '' }

function installFakeDom() {
    const errorLine = new FakeBox()
    function getElementById(id: string) {
        return id === 'errorLine' ? errorLine : null
    }
    Object.assign(globalThis, { document: { getElementById } })
    return errorLine
}

afterEach(removeFakeDom)

function removeFakeDom() {
    Reflect.deleteProperty(globalThis, 'document')
}

function buildUpdate(text: string, docChanged: boolean): ViewUpdate {
    return { docChanged, state: { doc: { toString: () => text } } } as unknown as ViewUpdate
}

function validateFixingTheStateJsonClearsTheStateError() {
    const errorLine = installFakeDom()
    const badResult = computeJsonParseResult('state', '{"a":')
    if (badResult.isValid)
        throw new Error('expected an invalid result')
    errorLine.textContent = badResult.errorMessage
    expect(errorLine.textContent.startsWith(STATE_ERROR_PREFIX)).toBe(true)
    clearStateJsonError(buildUpdate('{"a":1', true))
    expect(errorLine.textContent).toBe(badResult.errorMessage)
    clearStateJsonError(buildUpdate('{"a":1}', true))
    expect(errorLine.textContent).toBe('')
}

function validateUnrelatedErrorIsKept() {
    const errorLine = installFakeDom()
    errorLine.textContent = 'Run failed: 500 boom'
    clearStateJsonError(buildUpdate('{"a":1}', true))
    expect(errorLine.textContent).toBe('Run failed: 500 boom')
}

function validateUpdateWithoutDocChangeKeepsTheStateError() {
    const errorLine = installFakeDom()
    errorLine.textContent = 'state is not valid JSON: boom'
    clearStateJsonError(buildUpdate('{"a":1}', false))
    expect(errorLine.textContent).toBe('state is not valid JSON: boom')
}

test('test_fixing_the_state_json_clears_the_state_error', validateFixingTheStateJsonClearsTheStateError)
test('test_unrelated_error_is_kept', validateUnrelatedErrorIsKept)
test('test_update_without_doc_change_keeps_the_state_error', validateUpdateWithoutDocChangeKeepsTheStateError)
