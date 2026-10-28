import { test, expect, afterEach, mock, spyOn } from 'bun:test'
import type { EditorView } from '@codemirror/view'
import { launchDraftSession, syncDraftOnTick } from './draftSync'
import * as editors from './editors'
import { pageState } from './state'

const realFetch = globalThis.fetch
const SESSION_ID = '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d'

afterEach(() => {
  mock.restore()
  Reflect.deleteProperty(globalThis, 'sessionStorage')
  globalThis.fetch = realFetch
  pageState.versions = []
  pageState.index = 0
  pageState.editedDraft = null
})

function buildStubEditor(text: string) {
  return { state: { doc: { toString: () => text } } } as unknown as EditorView
}

async function validateTickSendsTheKeptDraftTextsWhenARealVersionIsShown() {
  pageState.versions = [{ id: 1, time: 't', state: { a: 1 }, questions: { q: 1 }, calls: 1, outputs: [] }]
  pageState.index = 0
  spyOn(editors, 'getStateEditor').mockReturnValue(buildStubEditor('{"a":1}'))
  spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildStubEditor('{"q":1}'))
  Object.assign(globalThis, { sessionStorage: { getItem: () => SESSION_ID, setItem: () => {} } })
  const seenBodies: unknown[] = []
  globalThis.fetch = (async (_path: string, init?: RequestInit) => {
    seenBodies.push(init?.body === undefined ? null : JSON.parse(String(init.body)))
    return Response.json(null)
  }) as unknown as typeof fetch
  spyOn(globalThis, 'setInterval').mockImplementation((() => 0) as unknown as typeof setInterval)
  await launchDraftSession()
  await new Promise((resolve) => setTimeout(resolve, 10))
  seenBodies.length = 0
  syncDraftOnTick()
  expect(seenBodies).toEqual([])
  pageState.editedDraft = { state: '{"a": 2}', questions: '{"q": 1}', baseIndex: 0 }
  syncDraftOnTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(seenBodies).toEqual([{ id: SESSION_ID, state: '{"a": 2}', questions: '{"q": 1}' }])
  syncDraftOnTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(seenBodies.length).toBe(1)
}

test('test_tick_sends_the_kept_draft_texts_when_a_real_version_is_shown', validateTickSendsTheKeptDraftTextsWhenARealVersionIsShown)
