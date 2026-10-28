import { test, expect, afterEach, mock, spyOn } from 'bun:test'
import type { EditorView } from '@codemirror/view'
import * as editors from './editors'
import { isKindTextEdited } from './noteKind'
import { pageState } from './state'

afterEach(removeFakeState)

function removeFakeState() {
  mock.restore()
  pageState.versions = []
  pageState.index = 0
}

function installState(stateText: string) {
  spyOn(editors, 'getStateEditor').mockReturnValue({ state: { doc: { toString: () => stateText } } } as unknown as EditorView)
  pageState.versions = [{ id: 1, time: 't', state: { a: 1 }, questions: {}, calls: 0, outputs: [] }]
  pageState.index = 0
}

function validateSameStateTextIsNotEdited() {
  installState('{ "a": 1 }')
  expect(isKindTextEdited('state')).toBe(false)
}

function validateDifferentStateTextIsEdited() {
  installState('{ "a": 2 }')
  expect(isKindTextEdited('state')).toBe(true)
}

test('test_same_state_text_is_not_edited', validateSameStateTextIsNotEdited)
test('test_different_state_text_is_edited', validateDifferentStateTextIsEdited)
