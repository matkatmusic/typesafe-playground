import { test, expect, afterEach } from 'bun:test'
import { createNotesButton } from './notesButton'

class FakeTextArea {
  value = ''
}

class FakeDialog {
  returnValue = ''
  isOpen = false
  addEventListener() {}
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
  const elements: Record<string, unknown> = { notesDialog: dialog, notesDialogTitle: title, notesDialogText: new FakeTextArea() }
  Object.assign(globalThis, {
    HTMLDialogElement: FakeDialog,
    HTMLTextAreaElement: FakeTextArea,
    document: { createElement: () => new FakeButton(), getElementById: (id: string) => elements[id] ?? null },
  })
  return { dialog, title }
}

function removeFakeDom() {
  Reflect.deleteProperty(globalThis, 'document')
  Reflect.deleteProperty(globalThis, 'HTMLDialogElement')
  Reflect.deleteProperty(globalThis, 'HTMLTextAreaElement')
}

afterEach(removeFakeDom)

function validateButtonLooksLikeAFormatButtonAndOpensTheDialog() {
  const { dialog, title } = installFakeDom()
  const button = createNotesButton('stateNotesButton', 'State notes') as unknown as FakeButton
  expect(button.id).toBe('stateNotesButton')
  expect(button.className).toBe('format-json-button')
  expect(button.textContent).toBe('notes')
  button.clickListener?.()
  expect(dialog.isOpen).toBe(true)
  expect(title.textContent).toBe('State notes')
}

test('test_button_looks_like_a_format_button_and_opens_the_dialog', validateButtonLooksLikeAFormatButtonAndOpensTheDialog)
