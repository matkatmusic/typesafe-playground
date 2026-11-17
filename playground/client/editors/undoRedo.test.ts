import { test, expect, afterEach, mock, spyOn } from 'bun:test'
import { history } from '@codemirror/commands'
import { EditorState, type Transaction } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import * as editors from './editors'
import { applyQuestionsRedo, applyQuestionsUndo, applyStateRedo, applyStateUndo } from './undoRedo'

afterEach(() => {
  mock.restore()
})

function buildHistoryView(startText: string) {
  let state = EditorState.create({ doc: startText, extensions: [history()] })
  const view = {
    get state() {
      return state
    },
    dispatch(transaction: Transaction) {
      state = transaction.state
    },
  }
  return view
}

function changeText(view: ReturnType<typeof buildHistoryView>, newText: string) {
  view.dispatch(view.state.update({ changes: { from: 0, to: view.state.doc.length, insert: newText } }))
}

function validateStateUndoBringsBackTheOldTextAndRedoTheNewText() {
  const view = buildHistoryView('old')
  spyOn(editors, 'getStateEditor').mockReturnValue(view as unknown as EditorView)
  changeText(view, 'new')
  applyStateUndo()
  expect(view.state.doc.toString()).toBe('old')
  applyStateRedo()
  expect(view.state.doc.toString()).toBe('new')
}

function validateQuestionsUndoBringsBackTheOldTextAndRedoTheNewText() {
  const view = buildHistoryView('old')
  spyOn(editors, 'getQuestionsEditor').mockReturnValue(view as unknown as EditorView)
  changeText(view, 'new')
  applyQuestionsUndo()
  expect(view.state.doc.toString()).toBe('old')
  applyQuestionsRedo()
  expect(view.state.doc.toString()).toBe('new')
}

test('test_state_undo_brings_back_the_old_text_and_redo_the_new_text', validateStateUndoBringsBackTheOldTextAndRedoTheNewText)
test('test_questions_undo_brings_back_the_old_text_and_redo_the_new_text', validateQuestionsUndoBringsBackTheOldTextAndRedoTheNewText)
