import { test, expect } from 'bun:test'
import { computeJsonParseResult } from './jsonParse'

function validateValidTextGivesTheValue() {
    expect(computeJsonParseResult('state', '{"a":1}')).toEqual({ isValid: true, value: { a: 1 } })
}

function validateInvalidTextGivesTheLabelledMessage() {
    const result = computeJsonParseResult('state', '{"a":')
    expect(result.isValid).toBe(false)
    if (result.isValid)
        throw new Error('expected an invalid result')
    expect(result.errorMessage.startsWith('state is not valid JSON: ')).toBe(true)
    expect(computeJsonParseResult('state', '').isValid).toBe(false)
}

test('test_valid_text_gives_the_value', validateValidTextGivesTheValue)
test('test_invalid_text_gives_the_labelled_message', validateInvalidTextGivesTheLabelledMessage)
