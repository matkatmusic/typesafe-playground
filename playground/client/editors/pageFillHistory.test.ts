import { test, expect, afterEach, mock, spyOn } from 'bun:test'
import { history, undo, undoDepth } from '@codemirror/commands'
import { EditorState, type TransactionSpec } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import * as editors from './editors'
import { formatEditorJson } from './formatJson'
import { refreshUndoRedoButtons } from './undoRedoButtons'

afterEach(() => {
  mock.restore()
  Reflect.deleteProperty(globalThis, 'document')
  Reflect.deleteProperty(globalThis, 'HTMLButtonElement')
})

function buildHistoryView(startText: string) {
  let state = EditorState.create({ doc: startText, extensions: [history()] })
  return {
    get state() {
      return state
    },
    dispatch(spec: TransactionSpec) {
      state = state.update(spec).state
    },
  }
}

function installPage(stateStartText = '') {
  const stateView = buildHistoryView(stateStartText)
  const questionsView = buildHistoryView('')
  spyOn(editors, 'getStateEditor').mockReturnValue(stateView as unknown as EditorView)
  spyOn(editors, 'getQuestionsEditor').mockReturnValue(questionsView as unknown as EditorView)
  const buttons: Record<string, { disabled: boolean; textContent: string }> = {}
  for (const id of ['stateUndoButton', 'stateRedoButton', 'questionsUndoButton', 'questionsRedoButton', 'errorLine'])
    buttons[id] = { disabled: false, textContent: '' }
  Object.assign(globalThis, { document: { getElementById: (id: string) => buttons[id] ?? null }, HTMLButtonElement: Object })
  return { stateView, questionsView, buttons }
}

function validatePageLoadedTextIsNotInTheUndoHistory() {
  const { stateView, questionsView, buttons } = installPage()
  editors.renderStateJson({ a: 1 })
  editors.renderQuestionsJson({ q: 1 })
  refreshUndoRedoButtons()
  expect(undoDepth(stateView.state)).toBe(0)
  expect(undoDepth(questionsView.state)).toBe(0)
  expect(buttons.stateUndoButton.disabled).toBe(true)
  expect(buttons.questionsUndoButton.disabled).toBe(true)
}

function validateUserEditAfterAPageFillUndoesOnlyThatEdit() {
  const { stateView, buttons } = installPage()
  editors.renderStateJson({ a: 1 })
  const loadedText = stateView.state.doc.toString()
  stateView.dispatch({ changes: { from: loadedText.length, insert: ' ' } })
  refreshUndoRedoButtons()
  expect(buttons.stateUndoButton.disabled).toBe(false)
  undo(stateView as unknown as EditorView)
  expect(stateView.state.doc.toString()).toBe(loadedText)
  expect(loadedText).not.toBe('')
}

function validateFormatJsonStaysUndoable() {
  const { stateView } = installPage('{"a":1}')
  formatEditorJson('state', stateView as unknown as EditorView)
  expect(stateView.state.doc.toString()).toBe('{\n  "a": 1\n}')
  undo(stateView as unknown as EditorView)
  expect(stateView.state.doc.toString()).toBe('{"a":1}')
}

test('test_page_loaded_text_is_not_in_the_undo_history', validatePageLoadedTextIsNotInTheUndoHistory)
test('test_user_edit_after_a_page_fill_undoes_only_that_edit', validateUserEditAfterAPageFillUndoesOnlyThatEdit)
test('test_format_json_stays_undoable', validateFormatJsonStaysUndoable)
