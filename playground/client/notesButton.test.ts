import { test, expect, afterEach, mock, spyOn } from 'bun:test'
import type { EditorView } from '@codemirror/view'
import * as editors from './editors'
import { createNotesButton } from './notesButton'
import { buildEmptyPendingNotes, pageState } from './state'

class FakeTextArea {
  value = ''
}

class FakeDialog {
  returnValue = ''
  isOpen = false
  closeListener: (() => void) | null = null
  addEventListener(_name: string, listener: () => void) {
    this.closeListener = listener
  }
  showModal() {
    this.isOpen = true
  }
}

class FakeButton {
  id = ''
  className = ''
  textContent = ''
  clickListener: (() => void) | null = null
  addEventListener(_name: string, listener: () => void) {
    this.clickListener = listener
  }
}

function installFakeDom() {
  const dialog = new FakeDialog()
  const title = { textContent: '' }
  const textArea = new FakeTextArea()
  const elements: Record<string, unknown> = { notesDialog: dialog, notesDialogTitle: title, notesDialogText: textArea, lastEditedLabel: { textContent: '' } }
  Object.assign(globalThis, {
    HTMLDialogElement: FakeDialog,
    HTMLTextAreaElement: FakeTextArea,
    document: { createElement: () => new FakeButton(), getElementById: (id: string) => elements[id] ?? null },
  })
  return { dialog, title, textArea }
}

function installPage(stateText: string) {
  spyOn(editors, 'getStateEditor').mockReturnValue({ state: { doc: { toString: () => stateText } } } as unknown as EditorView)
  spyOn(editors, 'getQuestionsEditor').mockReturnValue({ state: { doc: { toString: () => '{}' } } } as unknown as EditorView)
  pageState.versions = [{ id: 1, time: 't', state: { a: 1 }, questions: {}, calls: 0, outputs: [], stateNote: 'saved' }]
  pageState.index = 0
}

function removeFakeState() {
  mock.restore()
  Reflect.deleteProperty(globalThis, 'document')
  Reflect.deleteProperty(globalThis, 'HTMLDialogElement')
  Reflect.deleteProperty(globalThis, 'HTMLTextAreaElement')
  pageState.versions = []
  pageState.index = 0
  pageState.pendingNotes = buildEmptyPendingNotes()
}

afterEach(removeFakeState)

function clickNewButton() {
  const button = createNotesButton('stateNotesButton', 'State notes', 'state') as unknown as FakeButton
  button.clickListener?.()
  return button
}

function validateButtonLooksLikeAFormatButtonAndOpensTheDialogWithTheSavedNote() {
  const { dialog, title, textArea } = installFakeDom()
  installPage('{"a":1}')
  const button = clickNewButton()
  expect(button.id).toBe('stateNotesButton')
  expect(button.className).toBe('format-json-button')
  expect(button.textContent).toBe('notes')
  expect(dialog.isOpen).toBe(true)
  expect(title.textContent).toBe('State notes')
  expect(textArea.value).toBe('saved')
}

function validateUnrunEditsStartWithThePendingText() {
  const { textArea } = installFakeDom()
  installPage('{"a":2}')
  pageState.pendingNotes.state = 'pending'
  clickNewButton()
  expect(textArea.value).toBe('pending')
}

function validateUnrunEditsWithoutPendingTextStartEmptyWhenTheStateChanged() {
  const { textArea } = installFakeDom()
  installPage('{"a":2}')
  clickNewButton()
  expect(textArea.value).toBe('')
}

function validateUnrunEditsToOtherTextKeepTheBaseNoteWhenTheStateIsUnchanged() {
  const { textArea } = installFakeDom()
  installPage('{"a":1}')
  spyOn(editors, 'getQuestionsEditor').mockReturnValue({ state: { doc: { toString: () => '{"q":1}' } } } as unknown as EditorView)
  clickNewButton()
  expect(textArea.value).toBe('saved')
}

function validateOkWithUnrunEditsKeepsThePendingText() {
  const { dialog, textArea } = installFakeDom()
  installPage('{"a":2}')
  clickNewButton()
  textArea.value = 'typed'
  dialog.returnValue = 'ok'
  dialog.closeListener?.()
  expect(pageState.pendingNotes.state).toBe('typed')
  expect(pageState.versions[0].stateNote).toBe('saved')
}

test('test_button_looks_like_a_format_button_and_opens_the_dialog_with_the_saved_note', validateButtonLooksLikeAFormatButtonAndOpensTheDialogWithTheSavedNote)
test('test_unrun_edits_start_with_the_pending_text', validateUnrunEditsStartWithThePendingText)
test('test_unrun_edits_without_pending_text_start_empty_when_the_state_changed', validateUnrunEditsWithoutPendingTextStartEmptyWhenTheStateChanged)
test('test_unrun_edits_to_other_text_keep_the_base_note_when_the_state_is_unchanged', validateUnrunEditsToOtherTextKeepTheBaseNoteWhenTheStateIsUnchanged)
test('test_ok_with_unrun_edits_keeps_the_pending_text', validateOkWithUnrunEditsKeepsThePendingText)
