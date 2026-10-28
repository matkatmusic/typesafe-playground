import { test, expect, afterEach, mock, spyOn } from 'bun:test'
import { history, redo, undo } from '@codemirror/commands'
import { EditorState, type Transaction } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import * as editors from './editors'
import { attachUndoRedoButtons, refreshUndoRedoButtons } from './undoRedoButtons'

afterEach(() => {
  mock.restore()
  Reflect.deleteProperty(globalThis, 'document')
  Reflect.deleteProperty(globalThis, 'HTMLButtonElement')
})

function buildHistoryView() {
  let state = EditorState.create({ doc: 'old', extensions: [history()] })
  const dispatched: unknown[] = []
  const view = {
    get state() {
      return state
    },
    dispatch(spec: Transaction | { effects: unknown }) {
      dispatched.push(spec)
      if ('state' in spec)
        state = spec.state
    },
  }
  return { view, dispatched }
}

function installPage() {
  const stateView = buildHistoryView()
  const questionsView = buildHistoryView()
  spyOn(editors, 'getStateEditor').mockReturnValue(stateView.view as unknown as EditorView)
  spyOn(editors, 'getQuestionsEditor').mockReturnValue(questionsView.view as unknown as EditorView)
  const buttons: Record<string, { disabled: boolean }> = {}
  for (const id of ['stateUndoButton', 'stateRedoButton', 'questionsUndoButton', 'questionsRedoButton'])
    buttons[id] = { disabled: false }
  Object.assign(globalThis, { document: { getElementById: (id: string) => buttons[id] ?? null }, HTMLButtonElement: Object })
  return { stateView, questionsView, buttons }
}

function changeText(view: ReturnType<typeof buildHistoryView>['view'], newText: string) {
  view.dispatch(view.state.update({ changes: { from: 0, to: view.state.doc.length, insert: newText } }))
}

function validateButtonsAreDisabledWhenThereIsNothingToUndoOrRedo() {
  const { buttons } = installPage()
  refreshUndoRedoButtons()
  expect(buttons.stateUndoButton.disabled).toBe(true)
  expect(buttons.stateRedoButton.disabled).toBe(true)
  expect(buttons.questionsUndoButton.disabled).toBe(true)
  expect(buttons.questionsRedoButton.disabled).toBe(true)
}

function validateUndoIsEnabledAfterAChangeAndRedoAfterAnUndo() {
  const { stateView, questionsView, buttons } = installPage()
  changeText(stateView.view, 'new')
  refreshUndoRedoButtons()
  expect(buttons.stateUndoButton.disabled).toBe(false)
  expect(buttons.stateRedoButton.disabled).toBe(true)
  expect(buttons.questionsUndoButton.disabled).toBe(true)
  undo(stateView.view as unknown as EditorView)
  refreshUndoRedoButtons()
  expect(buttons.stateUndoButton.disabled).toBe(true)
  expect(buttons.stateRedoButton.disabled).toBe(false)
  changeText(questionsView.view, 'new')
  redo(stateView.view as unknown as EditorView)
  refreshUndoRedoButtons()
  expect(buttons.questionsUndoButton.disabled).toBe(false)
  expect(buttons.stateRedoButton.disabled).toBe(true)
}

function validateAttachAppendsAListenerToBothEditorsAndRefreshesOnce() {
  const { stateView, questionsView, buttons } = installPage()
  attachUndoRedoButtons()
  expect(stateView.dispatched.length).toBe(1)
  expect(questionsView.dispatched.length).toBe(1)
  expect(buttons.stateUndoButton.disabled).toBe(true)
}

test('test_buttons_are_disabled_when_there_is_nothing_to_undo_or_redo', validateButtonsAreDisabledWhenThereIsNothingToUndoOrRedo)
test('test_undo_is_enabled_after_a_change_and_redo_after_an_undo', validateUndoIsEnabledAfterAChangeAndRedoAfterAnUndo)
test('test_attach_appends_a_listener_to_both_editors_and_refreshes_once', validateAttachAppendsAListenerToBothEditorsAndRefreshesOnce)
