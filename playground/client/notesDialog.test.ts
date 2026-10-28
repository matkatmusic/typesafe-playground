import { test, expect, afterEach } from 'bun:test'
import { openNotesDialog } from './notesDialog'

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
  close(choice: string) {
    this.returnValue = choice
    this.isOpen = false
    this.closeListener?.()
  }
}

function installFakeDom() {
  const dialog = new FakeDialog()
  const title = { textContent: '' }
  const textArea = new FakeTextArea()
  const elements: Record<string, unknown> = { notesDialog: dialog, notesDialogTitle: title, notesDialogText: textArea }
  Object.assign(globalThis, { HTMLDialogElement: FakeDialog, HTMLTextAreaElement: FakeTextArea, document: { getElementById: (id: string) => elements[id] ?? null } })
  return { dialog, title, textArea }
}

function removeFakeDom() {
  Reflect.deleteProperty(globalThis, 'document')
  Reflect.deleteProperty(globalThis, 'HTMLDialogElement')
  Reflect.deleteProperty(globalThis, 'HTMLTextAreaElement')
}

afterEach(removeFakeDom)

function validateOpenFillsTheTitleAndTextAndShowsTheDialog() {
  const { dialog, title, textArea } = installFakeDom()
  openNotesDialog('State notes', 'start', () => {})
  expect(dialog.isOpen).toBe(true)
  expect(title.textContent).toBe('State notes')
  expect(textArea.value).toBe('start')
}

function validateOkPassesTheTextToOnOk() {
  const { dialog, textArea } = installFakeDom()
  const received: string[] = []
  openNotesDialog('t', 'start', (text) => received.push(text))
  textArea.value = 'edited'
  dialog.close('ok')
  expect(received).toEqual(['edited'])
}

function validateCancelDoesNothing() {
  const { dialog, textArea } = installFakeDom()
  const received: string[] = []
  openNotesDialog('t', 'start', (text) => received.push(text))
  textArea.value = 'edited'
  dialog.close('cancel')
  expect(received).toEqual([])
}

function validateEscapeDoesNothing() {
  const { dialog } = installFakeDom()
  const received: string[] = []
  openNotesDialog('t', 'start', (text) => received.push(text))
  dialog.close(dialog.returnValue)
  expect(received).toEqual([])
}

function validateOpenWithoutADocumentThrows() {
  expect(() => openNotesDialog('t', '', () => {})).toThrow()
}

test('test_open_fills_the_title_and_text_and_shows_the_dialog', validateOpenFillsTheTitleAndTextAndShowsTheDialog)
test('test_ok_passes_the_text_to_on_ok', validateOkPassesTheTextToOnOk)
test('test_cancel_does_nothing', validateCancelDoesNothing)
test('test_escape_does_nothing', validateEscapeDoesNothing)
test('test_open_without_a_document_throws', validateOpenWithoutADocumentThrows)
