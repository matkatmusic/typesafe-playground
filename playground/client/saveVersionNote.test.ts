import { test, expect, afterEach, mock, spyOn } from 'bun:test'
import type { EditorView } from '@codemirror/view'
import type { Version } from '../playgroundHistory'
import * as editors from './editors'
import { saveInheritedNote, saveShownNote } from './saveVersionNote'
import { buildEmptyPendingNotes, pageState } from './state'

const realFetch = globalThis.fetch

function buildVersion(id: number, stateNote: string | undefined): Version {
  return { id: id, time: 't', state: { a: 1 }, questions: {}, calls: 0, outputs: [], stateNote: stateNote }
}

function buildStubEditor(text: string) {
  return { state: { doc: { toString: () => text } } } as unknown as EditorView
}

function installPage(stateText: string, versions: Version[]) {
  const label = { textContent: '' }
  Object.assign(globalThis, { document: { getElementById: () => label } })
  spyOn(editors, 'getStateEditor').mockReturnValue(buildStubEditor(stateText))
  spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildStubEditor('{}'))
  pageState.versions = versions
  pageState.index = 0
  const seen: { path: string; body: Record<string, unknown> }[] = []
  async function stubFetch(path: string | URL | Request, init?: RequestInit) {
    const body = JSON.parse(String(init?.body))
    seen.push({ path: String(path), body: body })
    return Response.json({ ...buildVersion(body.id, body.stateNote) })
  }
  globalThis.fetch = stubFetch as unknown as typeof fetch
  return { seen, label }
}

afterEach(removeFakeState)

function removeFakeState() {
  mock.restore()
  Reflect.deleteProperty(globalThis, 'document')
  globalThis.fetch = realFetch
  pageState.versions = []
  pageState.index = 0
  pageState.isDirty = false
  pageState.pendingNotes = buildEmptyPendingNotes()
}

async function validateSavingWithoutEditsPostsAndStoresOnTheShownVersion() {
  const { seen, label } = installPage('{"a":1}', [buildVersion(7, undefined)])
  await saveShownNote('state', 'about state')
  expect(seen).toEqual([{ path: '/note', body: { id: 7, stateNote: 'about state' } }])
  expect(pageState.versions[0].stateNote).toBe('about state')
  expect(pageState.pendingNotes.state).toBeNull()
  expect(pageState.isDirty).toBe(true)
  expect(label.textContent.startsWith('last edited: ')).toBe(true)
}

async function validateSavingWithEditsOnlyKeepsThePendingText() {
  const { seen } = installPage('{"a":2}', [buildVersion(7, 'old')])
  await saveShownNote('state', 'waiting')
  expect(seen).toEqual([])
  expect(pageState.pendingNotes.state).toBe('waiting')
  expect(pageState.versions[0].stateNote).toBe('old')
}

async function validateInheritedPendingNoteWinsAndIsReset() {
  const { seen } = installPage('{"a":1}', [buildVersion(2, undefined)])
  pageState.pendingNotes.state = 'pending'
  await saveInheritedNote('state', 'base', true, pageState.versions[0])
  expect(seen).toEqual([{ path: '/note', body: { id: 2, stateNote: 'pending' } }])
  expect(pageState.versions[0].stateNote).toBe('pending')
  expect(pageState.pendingNotes.state).toBeNull()
}

async function validateInheritedUnchangedStateCopiesTheBaseNote() {
  const { seen } = installPage('{"a":1}', [buildVersion(2, undefined)])
  await saveInheritedNote('state', 'base', true, pageState.versions[0])
  expect(seen).toEqual([{ path: '/note', body: { id: 2, stateNote: 'base' } }])
  expect(pageState.versions[0].stateNote).toBe('base')
}

async function validateInheritedChangedStateGetsNoNoteAndResetsPending() {
  const { seen } = installPage('{"a":1}', [buildVersion(2, undefined)])
  await saveInheritedNote('state', 'base', false, pageState.versions[0])
  expect(seen).toEqual([])
  expect(pageState.versions[0].stateNote).toBeUndefined()
  expect(pageState.pendingNotes.state).toBeNull()
}

test('test_saving_without_edits_posts_and_stores_on_the_shown_version', validateSavingWithoutEditsPostsAndStoresOnTheShownVersion)
test('test_saving_with_edits_only_keeps_the_pending_text', validateSavingWithEditsOnlyKeepsThePendingText)
test('test_inherited_pending_note_wins_and_is_reset', validateInheritedPendingNoteWinsAndIsReset)
test('test_inherited_unchanged_state_copies_the_base_note', validateInheritedUnchangedStateCopiesTheBaseNote)
test('test_inherited_changed_state_gets_no_note_and_resets_pending', validateInheritedChangedStateGetsNoNoteAndResetsPending)
