import { test, expect, afterEach, mock, spyOn } from 'bun:test'
import type { EditorView } from '@codemirror/view'
import { applyDraft, sendDraft, launchDraftSession, syncDraftOnTick } from './draftSync'
import * as editors from './editors'
import { pageState } from './state'
import * as versionBox from './versionBox'

const realFetch = globalThis.fetch
const SESSION_ID = '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d'

afterEach(removeFakeState)

function removeFakeState() {
  mock.restore()
  Reflect.deleteProperty(globalThis, 'document')
  Reflect.deleteProperty(globalThis, 'sessionStorage')
  globalThis.fetch = realFetch
  pageState.isDirty = false
}

function buildStubEditor(texts: { value: string }) {
  return { state: { doc: { toString: () => texts.value } } } as unknown as EditorView
}

function installStubEditors(stateText: string, questionsText: string) {
  const stateTexts = { value: stateText }
  const questionsTexts = { value: questionsText }
  const stateEditor = buildStubEditor(stateTexts)
  const questionsEditor = buildStubEditor(questionsTexts)
  spyOn(editors, 'getStateEditor').mockReturnValue(stateEditor)
  spyOn(editors, 'getQuestionsEditor').mockReturnValue(questionsEditor)
  return { stateTexts, questionsTexts, stateEditor, questionsEditor }
}

function installFakeLabel() {
  const label = { textContent: '' }
  Object.assign(globalThis, { document: { getElementById: () => label } })
  return label
}

function installFakeSessionStorage(initial: Record<string, string>) {
  const stored: Record<string, string> = { ...initial }
  const fake = { getItem: (key: string) => stored[key] ?? null, setItem: (key: string, value: string) => { stored[key] = value } }
  Object.assign(globalThis, { sessionStorage: fake })
  return stored
}

function installFetchRecorder(draftToReturn: unknown) {
  const seen: { path: string; method: string; body: unknown }[] = []
  async function stubFetch(path: string | URL | Request, init?: RequestInit) {
    const body = init?.body === undefined ? null : JSON.parse(String(init.body))
    seen.push({ path: String(path), method: init?.method ?? 'GET', body: body })
    return Response.json(draftToReturn)
  }
  globalThis.fetch = stubFetch as typeof fetch
  return seen
}

async function validateStartDraftSessionCreatesAndStoresAnIdWithoutRestoring() {
  installStubEditors('s', 'q')
  const stored = installFakeSessionStorage({})
  const seen = installFetchRecorder(null)
  const intervalSpy = spyOn(globalThis, 'setInterval').mockImplementation((() => 0) as unknown as typeof setInterval)
  await launchDraftSession()
  expect(stored.playgroundSessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  expect(seen).toEqual([])
  expect(intervalSpy.mock.calls[0][1]).toBe(2000)
}

async function validateStartDraftSessionRestoresTheDraftOfAnExistingId() {
  const { questionsEditor } = installStubEditors('s', 'q')
  installFakeSessionStorage({ playgroundSessionId: SESSION_ID })
  installFakeLabel()
  const seen = installFetchRecorder({ state: 's', questions: 'q draft' })
  spyOn(globalThis, 'setInterval').mockImplementation((() => 0) as unknown as typeof setInterval)
  const replaceSpy = spyOn(editors, 'replaceEditorText').mockImplementation(() => {})
  spyOn(versionBox, 'refreshVersionBox').mockImplementation(() => {})
  await launchDraftSession()
  expect(seen).toEqual([{ path: `/draft?id=${SESSION_ID}`, method: 'GET', body: null }])
  expect(replaceSpy).toHaveBeenCalledTimes(1)
  expect(replaceSpy).toHaveBeenCalledWith(questionsEditor, 'q draft')
  expect(pageState.isDirty).toBe(true)
}

async function validateTickSendsOnlyWhenEditorTextChangedSinceTheLastSend() {
  const { stateTexts } = installStubEditors('s', 'q')
  installFakeSessionStorage({ playgroundSessionId: SESSION_ID })
  const seen = installFetchRecorder(null)
  spyOn(globalThis, 'setInterval').mockImplementation((() => 0) as unknown as typeof setInterval)
  await launchDraftSession()
  seen.length = 0
  syncDraftOnTick()
  expect(seen).toEqual([])
  stateTexts.value = '{"a": '
  syncDraftOnTick()
  await sendDraft()
  expect(seen[0]).toEqual({ path: '/draft', method: 'POST', body: { id: SESSION_ID, state: '{"a": ', questions: 'q' } })
  const sentCount = seen.length
  syncDraftOnTick()
  expect(seen.length).toBe(sentCount)
}

async function validateSendDraftPostsInOrder() {
  installStubEditors('s', 'q')
  installFakeSessionStorage({ playgroundSessionId: SESSION_ID })
  const seen = installFetchRecorder(null)
  spyOn(globalThis, 'setInterval').mockImplementation((() => 0) as unknown as typeof setInterval)
  await launchDraftSession()
  seen.length = 0
  void sendDraft()
  await sendDraft()
  expect(seen.length).toBe(2)
}

function validateApplyDraftDoesNothingForNullOrEqualText() {
  installStubEditors('s', 'q')
  const replaceSpy = spyOn(editors, 'replaceEditorText').mockImplementation(() => {})
  const refreshSpy = spyOn(versionBox, 'refreshVersionBox').mockImplementation(() => {})
  applyDraft(null)
  applyDraft({ state: 's', questions: 'q' })
  expect(replaceSpy).not.toHaveBeenCalled()
  expect(refreshSpy).not.toHaveBeenCalled()
  expect(pageState.isDirty).toBe(false)
}

function validateApplyDraftReplacesOnlyTheDifferingEditorAndMarksTheChangeOnce() {
  const { stateEditor, questionsEditor } = installStubEditors('s', 'q')
  const label = installFakeLabel()
  const replaceSpy = spyOn(editors, 'replaceEditorText').mockImplementation(() => {})
  const refreshSpy = spyOn(versionBox, 'refreshVersionBox').mockImplementation(() => {})
  applyDraft({ state: 's', questions: 'q draft' })
  expect(replaceSpy).toHaveBeenCalledTimes(1)
  expect(replaceSpy).toHaveBeenCalledWith(questionsEditor, 'q draft')
  expect(replaceSpy).not.toHaveBeenCalledWith(stateEditor, 's')
  expect(refreshSpy).toHaveBeenCalledTimes(1)
  expect(pageState.isDirty).toBe(true)
  expect(label.textContent).toContain('last edited: ')
}

test('test_start_draft_session_creates_and_stores_an_id_without_restoring', validateStartDraftSessionCreatesAndStoresAnIdWithoutRestoring)
test('test_start_draft_session_restores_the_draft_of_an_existing_id', validateStartDraftSessionRestoresTheDraftOfAnExistingId)
test('test_tick_sends_only_when_editor_text_changed_since_the_last_send', validateTickSendsOnlyWhenEditorTextChangedSinceTheLastSend)
test('test_send_draft_posts_in_order', validateSendDraftPostsInOrder)
test('test_apply_draft_does_nothing_for_null_or_equal_text', validateApplyDraftDoesNothingForNullOrEqualText)
test('test_apply_draft_replaces_only_the_differing_editor_and_marks_the_change_once', validateApplyDraftReplacesOnlyTheDifferingEditorAndMarksTheChangeOnce)
