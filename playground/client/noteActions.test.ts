import { test, expect, afterEach } from 'bun:test'
import { saveNote } from './noteActions'
import { pageState } from './state'

class FakeTextArea {
  value = 'my note'
}

const realFetch = globalThis.fetch

afterEach(removeFakeState)

function removeFakeState() {
  Reflect.deleteProperty(globalThis, 'document')
  Reflect.deleteProperty(globalThis, 'HTMLTextAreaElement')
  globalThis.fetch = realFetch
  pageState.isDirty = false
  pageState.versions = []
  pageState.index = 0
}

function installFakeDom() {
  const elements = { noteText: new FakeTextArea(), lastEditedLabel: { textContent: '' } }
  const getById = (id: keyof typeof elements) => elements[id]
  Object.assign(globalThis, { HTMLTextAreaElement: FakeTextArea, document: { getElementById: getById } })
  return elements
}

async function validateSaveNotePostsTheNoteAndMarksTheChange() {
  const elements = installFakeDom()
  const version = { id: 3, time: 't', state: {}, questions: {}, calls: 1, outputs: [] }
  pageState.versions = [{ ...version, id: 1 }, version]
  pageState.index = 1
  let seenPath = ''
  let seenBody = ''
  async function stubFetch(path: string | URL | Request, init?: RequestInit) {
    seenPath = String(path)
    seenBody = String(init?.body)
    return Response.json({ ...version, note: 'my note' })
  }
  globalThis.fetch = stubFetch as typeof fetch
  await saveNote()
  expect(seenPath).toBe('/note')
  expect(JSON.parse(seenBody)).toEqual({ id: 3, note: 'my note' })
  expect((version as { note?: string }).note).toBe('my note')
  expect(pageState.isDirty).toBe(true)
  expect(elements.lastEditedLabel.textContent).toContain('last edited: ')
}

async function validateSaveNoteLeavesThePageCleanWhenTheServerRefuses() {
  installFakeDom()
  pageState.versions = [{ id: 1, time: 't', state: {}, questions: {}, calls: 0, outputs: [] }]
  async function stubFetch() {
    return new Response('no', { status: 400 })
  }
  globalThis.fetch = stubFetch as unknown as typeof fetch
  await expect(saveNote()).rejects.toThrow('HTTP 400')
  expect(pageState.isDirty).toBe(false)
}

test('test_save_note_posts_the_note_and_marks_the_change', validateSaveNotePostsTheNoteAndMarksTheChange)
test('test_save_note_leaves_the_page_clean_when_the_server_refuses', validateSaveNoteLeavesThePageCleanWhenTheServerRefuses)
