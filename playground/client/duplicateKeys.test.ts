import { test, expect } from 'bun:test'
import { json } from '@codemirror/lang-json'
import { EditorState } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import { findDuplicateKeys } from './duplicateKeys'

function findInText(text: string) {
  const state = EditorState.create({ doc: text, extensions: [json()] })
  return findDuplicateKeys({ state } as unknown as EditorView)
}

function validateTwoTopLevelCopiesGetOneDiagnosticEachAndNestedSameKeyIsFine() {
  const text = '{"a": 1, "a": 2, "b": {"a": 3}}'
  const firstFrom = text.indexOf('"a"')
  const secondFrom = text.indexOf('"a"', firstFrom + 1)
  expect(findInText(text)).toEqual([
    { from: firstFrom, to: firstFrom + 3, severity: 'error', message: '"a" appears more than once in this object' },
    { from: secondFrom, to: secondFrom + 3, severity: 'error', message: '"a" appears more than once in this object' },
  ])
}

function validateNestedDuplicatesAreCaught() {
  const text = '{"b": {"c": 1, "c": 2}, "d": [{"e": 1, "e": 2, "e": 3}]}'
  const diagnostics = findInText(text)
  expect(diagnostics.length).toBe(5)
  expect(diagnostics[0].message).toBe('"c" appears more than once in this object')
  expect(diagnostics[2].message).toBe('"e" appears more than once in this object')
}

function validateNoDuplicatesGivesNoDiagnostics() {
  expect(findInText('{"a": 1, "b": {"a": 2}}')).toEqual([])
  expect(findInText('')).toEqual([])
}

test('test_two_top_level_copies_get_one_diagnostic_each_and_nested_same_key_is_fine', validateTwoTopLevelCopiesGetOneDiagnosticEachAndNestedSameKeyIsFine)
test('test_nested_duplicates_are_caught', validateNestedDuplicatesAreCaught)
test('test_no_duplicates_gives_no_diagnostics', validateNoDuplicatesGivesNoDiagnostics)
