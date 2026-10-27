import { test, expect, afterEach } from 'bun:test'
import { resetVersionRuns } from './resetRuns'
import { pageState } from './state'

const realFetch = globalThis.fetch

afterEach(removeFakeState)

function removeFakeState() {
  Reflect.deleteProperty(globalThis, 'document')
  Reflect.deleteProperty(globalThis, 'confirm')
  globalThis.fetch = realFetch
  pageState.isDirty = false
  pageState.pinnedId = null
  pageState.versions = []
  pageState.index = 0
}

function buildRanVersion() {
  return { id: 4, time: 't', state: {}, questions: {}, calls: 2, outputs: [{}, {}], note: 'n' }
}

function installFakeConfirm(answer: boolean) {
  Object.assign(globalThis, { confirm: () => answer })
}

async function validateDeclinedConfirmDoesNotCallTheServer() {
  let fetchCount = 0
  async function stubFetch() {
    fetchCount++
    return new Response('{}')
  }
  globalThis.fetch = stubFetch as unknown as typeof fetch
  installFakeConfirm(false)
  pageState.versions = [buildRanVersion()] as never
  await resetVersionRuns()
  expect(fetchCount).toBe(0)
  expect(pageState.isDirty).toBe(false)
  expect(pageState.versions[0].outputs.length).toBe(2)
}

async function validateConfirmedResetPostsTheIdStoresTheClearedVersionAndMarksTheChange() {
  const elements = { lastEditedLabel: { textContent: '' } }
  const getById = (id: keyof typeof elements) => elements[id]
  Object.assign(globalThis, { document: { getElementById: getById } })
  installFakeConfirm(true)
  let seenPath = ''
  let seenBody = ''
  async function stubFetch(path: string | URL | Request, init?: RequestInit) {
    seenPath = String(path)
    seenBody = String(init?.body)
    return Response.json({ ...buildRanVersion(), calls: 0, outputs: [] })
  }
  globalThis.fetch = stubFetch as typeof fetch
  pageState.versions = [buildRanVersion()] as never
  // the page draw after the state change needs a real document, so it throws here
  await expect(resetVersionRuns()).rejects.toThrow()
  expect(seenPath).toBe('/reset-runs')
  expect(JSON.parse(seenBody)).toEqual({ id: 4 })
  expect(pageState.versions[0].outputs).toEqual([])
  expect(pageState.versions[0].calls).toBe(0)
  expect(pageState.versions[0].note).toBe('n')
  expect(pageState.isDirty).toBe(true)
  expect(elements.lastEditedLabel.textContent).toContain('last edited: ')
}

async function validateResetUnpinsOnlyThePinnedVersion() {
  Object.assign(globalThis, { document: { getElementById: () => ({ textContent: '' }) } })
  installFakeConfirm(true)
  async function stubFetch() {
    return Response.json({ ...buildRanVersion(), calls: 0, outputs: [] })
  }
  globalThis.fetch = stubFetch as unknown as typeof fetch
  pageState.versions = [buildRanVersion()] as never
  pageState.pinnedId = 9
  await expect(resetVersionRuns()).rejects.toThrow()
  expect(pageState.pinnedId).toBe(9)
  pageState.pinnedId = 4
  await expect(resetVersionRuns()).rejects.toThrow()
  expect(pageState.pinnedId).toBeNull()
}

test('test_reset_unpins_only_the_pinned_version', validateResetUnpinsOnlyThePinnedVersion)
test('test_declined_confirm_does_not_call_the_server', validateDeclinedConfirmDoesNotCallTheServer)
test('test_confirmed_reset_posts_the_id_stores_the_cleared_version_and_marks_the_change', validateConfirmedResetPostsTheIdStoresTheClearedVersionAndMarksTheChange)
