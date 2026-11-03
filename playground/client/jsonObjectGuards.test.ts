import { test, expect } from 'bun:test'
import { isJsonObject, isQuestionsObject } from './jsonObjectGuards'

const OBJECT_VALUES: unknown[] = [{}, { a: 1 }, { q: { type: 'noul' } }]
const NON_OBJECT_VALUES: unknown[] = [[], [1], null, 3, 'x', true, undefined]

function validateJsonObjectAcceptsPlainObjects() {
    for (const value of OBJECT_VALUES)
        expect(isJsonObject(value)).toBe(true)
}

function validateJsonObjectRejectsArraysNullNumbersAndStrings() {
    for (const value of NON_OBJECT_VALUES)
        expect(isJsonObject(value)).toBe(false)
}

function validateQuestionsObjectAcceptsPlainObjects() {
    for (const value of OBJECT_VALUES)
        expect(isQuestionsObject(value)).toBe(true)
}

function validateQuestionsObjectRejectsArraysNullNumbersAndStrings() {
    for (const value of NON_OBJECT_VALUES)
        expect(isQuestionsObject(value)).toBe(false)
}

test('test_json_object_accepts_plain_objects', validateJsonObjectAcceptsPlainObjects)
test('test_json_object_rejects_arrays_null_numbers_and_strings', validateJsonObjectRejectsArraysNullNumbersAndStrings)
test('test_questions_object_accepts_plain_objects', validateQuestionsObjectAcceptsPlainObjects)
test('test_questions_object_rejects_arrays_null_numbers_and_strings', validateQuestionsObjectRejectsArraysNullNumbersAndStrings)
