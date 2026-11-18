import { test, expect } from 'bun:test';
import { isJsonObject, isQuestionsObject } from './jsonObjectGuards';

function getObjectValues(): unknown[] {
    return [{}, { a: 1 }, { q: { type: 'noul' } }];
}

function getNonObjectValues(): unknown[] {
    return [[], [1], null, 3, 'x', true, undefined];
}

function validateJsonObjectAcceptsPlainObjects() {
    for (const value of getObjectValues())
        expect(isJsonObject(value)).toBe(true);
}

function validateJsonObjectRejectsArraysNullNumbersAndStrings() {
    for (const value of getNonObjectValues())
        expect(isJsonObject(value)).toBe(false);
}

function validateQuestionsObjectAcceptsPlainObjects() {
    for (const value of getObjectValues())
        expect(isQuestionsObject(value)).toBe(true);
}

function validateQuestionsObjectRejectsArraysNullNumbersAndStrings() {
    for (const value of getNonObjectValues())
        expect(isQuestionsObject(value)).toBe(false);
}

test('test_json_object_accepts_plain_objects', validateJsonObjectAcceptsPlainObjects);
test('test_json_object_rejects_arrays_null_numbers_and_strings', validateJsonObjectRejectsArraysNullNumbersAndStrings);
test('test_questions_object_accepts_plain_objects', validateQuestionsObjectAcceptsPlainObjects);
test('test_questions_object_rejects_arrays_null_numbers_and_strings', validateQuestionsObjectRejectsArraysNullNumbersAndStrings);
