import { test, expect } from 'bun:test'
import type { Version } from '../playgroundHistory'
import { buildNoteBody, readSavedNote, storeSavedNote } from './noteLocation'

function buildVersion(): Version {
  return { id: 1, time: 't', state: {}, questions: {}, calls: 0, outputs: [], stateNote: 's', questionsNote: 'q', resultNotes: { a: 'ra' } }
}

function validateReadSavedNotePicksTheFieldOrTheQuestionKey() {
  expect(readSavedNote(buildVersion(), { kind: 'state' })).toBe('s')
  expect(readSavedNote(buildVersion(), { kind: 'questions' })).toBe('q')
  expect(readSavedNote(buildVersion(), { kind: 'result', question: 'a' })).toBe('ra')
  expect(readSavedNote(buildVersion(), { kind: 'result', question: 'missing' })).toBeUndefined()
  expect(readSavedNote({ ...buildVersion(), resultNotes: undefined }, { kind: 'result', question: 'a' })).toBeUndefined()
}

function validateBuildNoteBodyUsesTheFieldOrTheQuestionKey() {
  expect(buildNoteBody({ kind: 'state' }, 'x')).toEqual({ stateNote: 'x' })
  expect(buildNoteBody({ kind: 'questions' }, 'x')).toEqual({ questionsNote: 'x' })
  expect(buildNoteBody({ kind: 'result', question: 'a' }, 'x')).toEqual({ resultNotes: { a: 'x' } })
}

function validateStoreSavedNoteCopiesOnlyTheLocationField() {
  const version = buildVersion()
  const saved = { ...buildVersion(), stateNote: 'new s', questionsNote: 'new q', resultNotes: { a: 'new ra', b: 'rb' } }
  storeSavedNote(version, saved, { kind: 'state' })
  expect(version).toEqual({ ...buildVersion(), stateNote: 'new s' })
  storeSavedNote(version, saved, { kind: 'questions' })
  expect(version.questionsNote).toBe('new q')
  storeSavedNote(version, saved, { kind: 'result', question: 'b' })
  expect(version.resultNotes).toEqual({ a: 'new ra', b: 'rb' })
}

test('test_read_saved_note_picks_the_field_or_the_question_key', validateReadSavedNotePicksTheFieldOrTheQuestionKey)
test('test_build_note_body_uses_the_field_or_the_question_key', validateBuildNoteBodyUsesTheFieldOrTheQuestionKey)
test('test_store_saved_note_copies_only_the_location_field', validateStoreSavedNoteCopiesOnlyTheLocationField)
