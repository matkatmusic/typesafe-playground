import { test, expect, afterEach, mock, spyOn } from 'bun:test'
import type { EditorView } from '@codemirror/view'
import * as editors from './editors'
import { pageState } from './state'
import { refreshVersionBox } from './versionBox'

class FakeTextArea {
  value = ''
  disabled = false
  placeholder = ''
}

function buildStubEditor(text: string) {
  return { state: { doc: { toString: () => text } } } as unknown as EditorView
}

function installFakeDom(noteText: FakeTextArea) {
  const elements: Record<string, unknown> = { versionLabel: { textContent: '' }, noteText: noteText }
  Object.assign(globalThis, { HTMLTextAreaElement: FakeTextArea, document: { getElementById: (id: string) => elements[id] ?? null } })
}

function installEditors(stateText: string) {
  spyOn(editors, 'getStateEditor').mockReturnValue(buildStubEditor(stateText))
  spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildStubEditor('{}'))
}

function removeFakeState() {
  mock.restore()
  Reflect.deleteProperty(globalThis, 'document')
  Reflect.deleteProperty(globalThis, 'HTMLTextAreaElement')
  pageState.versions = []
  pageState.index = 0
}

afterEach(removeFakeState)

function validateEditedVersionDisablesTheNoteBoxAndRevertRestoresIt() {
  const noteText = new FakeTextArea()
  installFakeDom(noteText)
  pageState.versions = [{ id: 1, time: '2026-03-04T05:06:07.000Z', state: { a: 1 }, questions: {}, calls: 1, outputs: [{}] as never, note: 'kept' }]
  pageState.index = 0
  installEditors('{"a":2}')
  refreshVersionBox()
  expect(noteText.disabled).toBe(true)
  expect(noteText.value).toBe('')
  expect(noteText.placeholder).toBe('Submit a run to add a note')
  mock.restore()
  installEditors('{"a":1}')
  refreshVersionBox()
  expect(noteText.disabled).toBe(false)
  expect(noteText.value).toBe('kept')
  expect(noteText.placeholder).toBe('Note about this run')
}

test('test_edited_version_disables_the_note_box_and_revert_restores_it', validateEditedVersionDisablesTheNoteBoxAndRevertRestoresIt)
