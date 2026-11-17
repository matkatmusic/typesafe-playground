import { test, expect } from 'bun:test'
import { isPlainObject } from './isPlainObject'

function validateObjectIsPlain() {
    expect(isPlainObject({})).toBe(true)
}

function validateArrayNullNumberAndStringAreNotPlain() {
    expect(isPlainObject([])).toBe(false)
    expect(isPlainObject(null)).toBe(false)
    expect(isPlainObject(3)).toBe(false)
    expect(isPlainObject('x')).toBe(false)
}

test('test_object_is_plain', validateObjectIsPlain)
test('test_array_null_number_and_string_are_not_plain', validateArrayNullNumberAndStringAreNotPlain)
