import { test, expect, afterEach, mock, spyOn } from 'bun:test'
import type { EditorView } from '@codemirror/view'
import { computePositionCount, isEditedPositionKept, isEditorTextEdited, isEditorTextOverwritingShownVersion } from './editedPosition'
import * as editors from './editors'
import { pageState } from './state'
import { HARD_CODED_QUESTIONS, HARD_CODED_STATE } from '../typeSafeQuery'

afterEach(() => {
  mock.restore()
  pageState.versions = []
  pageState.index = 0
  pageState.editedDraft = null
})

function installEditorTexts(stateText: string, questionsText: string) {
  pageState.versions = [{ id: 1, time: 't', state: { a: 1 }, questions: { q: 1 }, calls: 1, outputs: [] }]
  pageState.index = 0
  spyOn(editors, 'getStateEditor').mockReturnValue({ state: { doc: { toString: () => stateText } } } as unknown as EditorView)
  spyOn(editors, 'getQuestionsEditor').mockReturnValue({ state: { doc: { toString: () => questionsText } } } as unknown as EditorView)
}

function validateCountIsOneMoreOnlyWhenEditedOrADraftIsKept() {
  installEditorTexts('{"a":1}', '{"q":1}')
  expect(isEditorTextEdited()).toBe(false)
  expect(isEditedPositionKept()).toBe(false)
  expect(computePositionCount()).toBe(1)
  pageState.editedDraft = { state: '{"a": 2}', questions: '{"q":1}', baseIndex: 0 }
  expect(isEditedPositionKept()).toBe(true)
  expect(computePositionCount()).toBe(2)
  pageState.editedDraft = null
  installEditorTexts('{"a": 2}', '{"q":1}')
  expect(isEditorTextEdited()).toBe(true)
  expect(computePositionCount()).toBe(2)
}

function validateTextThatDiffersOnlyInSpacingIsNotEdited() {
  installEditorTexts('{ "a" : 1 }', '{\n "q": 1\n}')
  expect(isEditorTextEdited()).toBe(false)
}

function validateOverwriteIsTrueOnlyForValidEditedTextThatTheRuleOverwrites() {
  installEditorTexts('{"a":1}', '{"q":1}')
  expect(isEditorTextOverwritingShownVersion()).toBe(false)
  pageState.versions = [{ time: 't', state: HARD_CODED_STATE, questions: HARD_CODED_QUESTIONS, calls: 0, outputs: [] }]
  const questionsText = JSON.stringify(HARD_CODED_QUESTIONS)
  spyOn(editors, 'getStateEditor').mockReturnValue({ state: { doc: { toString: () => '{"a":2}' } } } as unknown as EditorView)
  spyOn(editors, 'getQuestionsEditor').mockReturnValue({ state: { doc: { toString: () => questionsText } } } as unknown as EditorView)
  expect(isEditorTextOverwritingShownVersion()).toBe(true)
  expect(computePositionCount()).toBe(1)
  pageState.versions.push({ time: 't', state: { b: 1 }, questions: {}, calls: 0, outputs: [] })
  expect(computePositionCount()).toBe(3)
  spyOn(editors, 'getStateEditor').mockReturnValue({ state: { doc: { toString: () => '{"a":' } } } as unknown as EditorView)
  expect(isEditorTextOverwritingShownVersion()).toBe(false)
}

test('test_overwrite_is_true_only_for_valid_edited_text_that_the_rule_overwrites', validateOverwriteIsTrueOnlyForValidEditedTextThatTheRuleOverwrites)
test('test_count_is_one_more_only_when_edited_or_a_draft_is_kept', validateCountIsOneMoreOnlyWhenEditedOrADraftIsKept)
test('test_text_that_differs_only_in_spacing_is_not_edited', validateTextThatDiffersOnlyInSpacingIsNotEdited)
