import { test, expect, afterEach, mock, spyOn } from 'bun:test'
import type { EditorView, ViewUpdate } from '@codemirror/view'
import { applyDraft, attachDraftSync, sendDraft, syncDraftOnChange } from './draftSync'
import * as editors from './editors'
import { pageState } from './state'
import * as versionBox from './versionBox'

const realFetch = globalThis.fetch

afterEach(removeFakeState)

function removeFakeState() {
  mock.restore()
  Reflect.deleteProperty(globalThis, 'document')
  globalThis.fetch = realFetch
  pageState.isDirty = false
}

function buildStubEditor(text: string) {
  const dispatched: unknown[] = []
  const editor = { state: { doc: { toString: () => text } }, dispatch: (spec: unknown) => dispatched.push(spec) }
  return { editor: editor as unknown as EditorView, dispatched: dispatched }
}

function installStubEditors(stateText: string, questionsText: string) {
  const stateStub = buildStubEditor(stateText)
  const questionsStub = buildStubEditor(questionsText)
  spyOn(editors, 'getStateEditor').mockReturnValue(stateStub.editor)
  spyOn(editors, 'getQuestionsEditor').mockReturnValue(questionsStub.editor)
  return { stateStub, questionsStub }
}

function installFakeLabel() {
  const label = { textContent: '' }
  Object.assign(globalThis, { document: { getElementById: () => label } })
  return label
}

async function validateSendDraftPostsBothEditorTextsInOrder() {
  installStubEditors('{"a": ', '[1,')
  const seenBodies: unknown[] = []
  async function stubFetch(path: string | URL | Request, init?: RequestInit) {
    expect(String(path)).toBe('/draft')
    seenBodies.push(JSON.parse(String(init?.body)))
    return new Response('ok')
  }
  globalThis.fetch = stubFetch as typeof fetch
  void sendDraft()
  await sendDraft()
  expect(seenBodies).toEqual([{ state: '{"a": ', questions: '[1,' }, { state: '{"a": ', questions: '[1,' }])
}

function validateSyncDraftOnChangeIgnoresUpdatesWithoutDocChanges() {
  installStubEditors('s', 'q')
  let postCount = 0
  globalThis.fetch = (async () => {
    postCount += 1
    return new Response('ok')
  }) as unknown as typeof fetch
  syncDraftOnChange({ docChanged: false } as ViewUpdate)
  expect(postCount).toBe(0)
}

async function validateSyncDraftOnChangePostsWhenTheDocChanged() {
  installStubEditors('s', 'q')
  let postCount = 0
  globalThis.fetch = (async () => {
    postCount += 1
    return new Response('ok')
  }) as unknown as typeof fetch
  syncDraftOnChange({ docChanged: true } as ViewUpdate)
  await sendDraft()
  expect(postCount).toBe(2)
}

function validateAttachDraftSyncAppendsAListenerToBothEditors() {
  const { stateStub, questionsStub } = installStubEditors('s', 'q')
  attachDraftSync()
  expect(stateStub.dispatched.length).toBe(1)
  expect(questionsStub.dispatched.length).toBe(1)
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
  const { stateStub, questionsStub } = installStubEditors('s', 'q')
  const label = installFakeLabel()
  const replaceSpy = spyOn(editors, 'replaceEditorText').mockImplementation(() => {})
  const refreshSpy = spyOn(versionBox, 'refreshVersionBox').mockImplementation(() => {})
  applyDraft({ state: 's', questions: 'q draft' })
  expect(replaceSpy).toHaveBeenCalledTimes(1)
  expect(replaceSpy).toHaveBeenCalledWith(questionsStub.editor, 'q draft')
  expect(replaceSpy).not.toHaveBeenCalledWith(stateStub.editor, 's')
  expect(refreshSpy).toHaveBeenCalledTimes(1)
  expect(pageState.isDirty).toBe(true)
  expect(label.textContent).toContain('last edited: ')
}

test('test_send_draft_posts_both_editor_texts_in_order', validateSendDraftPostsBothEditorTextsInOrder)
test('test_sync_draft_on_change_ignores_updates_without_doc_changes', validateSyncDraftOnChangeIgnoresUpdatesWithoutDocChanges)
test('test_sync_draft_on_change_posts_when_the_doc_changed', validateSyncDraftOnChangePostsWhenTheDocChanged)
test('test_attach_draft_sync_appends_a_listener_to_both_editors', validateAttachDraftSyncAppendsAListenerToBothEditors)
test('test_apply_draft_does_nothing_for_null_or_equal_text', validateApplyDraftDoesNothingForNullOrEqualText)
test('test_apply_draft_replaces_only_the_differing_editor_and_marks_the_change_once', validateApplyDraftReplacesOnlyTheDifferingEditorAndMarksTheChangeOnce)
