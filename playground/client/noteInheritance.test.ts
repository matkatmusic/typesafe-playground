import { test, expect } from 'bun:test'
import { computeInheritedNote, computeNoteStartText } from './noteInheritance'

function validatePendingNoteWins() {
  expect(computeInheritedNote('pending', 'base', true)).toBe('pending')
  expect(computeInheritedNote('pending', 'base', false)).toBe('pending')
  expect(computeInheritedNote('', 'base', true)).toBe('')
}

function validateUnchangedTextCopiesTheBaseNote() {
  expect(computeInheritedNote(null, 'base', true)).toBe('base')
  expect(computeInheritedNote(null, undefined, true)).toBeUndefined()
}

function validateChangedTextGetsNoNote() {
  expect(computeInheritedNote(null, 'base', false)).toBeUndefined()
}

function validateStartTextWithoutEditsIsTheSavedNote() {
  expect(computeNoteStartText(false, 'saved', 'pending', false)).toBe('saved')
  expect(computeNoteStartText(false, undefined, null, true)).toBe('')
}

function validateStartTextWithEditsFollowsTheInheritRule() {
  expect(computeNoteStartText(true, 'base', 'pending', true)).toBe('pending')
  expect(computeNoteStartText(true, 'base', null, true)).toBe('base')
  expect(computeNoteStartText(true, 'base', null, false)).toBe('')
  expect(computeNoteStartText(true, undefined, null, true)).toBe('')
}

test('test_pending_note_wins', validatePendingNoteWins)
test('test_unchanged_text_copies_the_base_note', validateUnchangedTextCopiesTheBaseNote)
test('test_changed_text_gets_no_note', validateChangedTextGetsNoNote)
test('test_start_text_without_edits_is_the_saved_note', validateStartTextWithoutEditsIsTheSavedNote)
test('test_start_text_with_edits_follows_the_inherit_rule', validateStartTextWithEditsFollowsTheInheritRule)
