import { test, expect, afterEach } from 'bun:test'
import { applyNoteBox, computeNotePlaceholder, computeNoteValue, getNoteText } from './noteBox'

class FakeTextArea {
  value = ''
  disabled = false
  placeholder = ''
}

afterEach(removeFakeState)

function removeFakeState() {
  Reflect.deleteProperty(globalThis, 'document')
  Reflect.deleteProperty(globalThis, 'HTMLTextAreaElement')
}

function installFakeTextArea(element: unknown) {
  Object.assign(globalThis, { HTMLTextAreaElement: FakeTextArea, document: { getElementById: () => element } })
}

function buildVersion(outputCount: number, note: string | undefined) {
  const outputs: never[] = []
  for (let i = 0; i < outputCount; i++)
    outputs.push({} as never)
  return { id: 1, time: 't', state: {}, questions: {}, calls: outputCount, outputs: outputs, note: note }
}

function validateNoteValue() {
  expect(computeNoteValue(true, 'kept')).toBe('kept')
  expect(computeNoteValue(true, undefined)).toBe('')
  expect(computeNoteValue(false, 'kept')).toBe('')
}

function validateNotePlaceholder() {
  expect(computeNotePlaceholder(true)).not.toBe(computeNotePlaceholder(false))
  expect(computeNotePlaceholder(false)).toBe('Submit a run to add a note')
}

function validateApplyNoteBoxDisablesUntilARunExists() {
  const textArea = new FakeTextArea()
  installFakeTextArea(textArea)
  applyNoteBox(buildVersion(0, 'kept'))
  expect(textArea.disabled).toBe(true)
  expect(textArea.value).toBe('')
  expect(textArea.placeholder).toBe('Submit a run to add a note')
  applyNoteBox(buildVersion(1, 'kept'))
  expect(textArea.disabled).toBe(false)
  expect(textArea.value).toBe('kept')
  expect(textArea.placeholder).toBe('Note about this run')
}

function validateGetNoteTextThrowsForAnotherElement() {
  installFakeTextArea({})
  expect(() => getNoteText()).toThrow()
}

test('test_note_value_is_empty_until_a_run_exists', validateNoteValue)
test('test_note_placeholder_depends_on_the_run', validateNotePlaceholder)
test('test_apply_note_box_disables_the_box_until_a_run_exists', validateApplyNoteBoxDisablesUntilARunExists)
test('test_get_note_text_throws_when_the_element_is_not_a_textarea', validateGetNoteTextThrowsForAnotherElement)
