import { test, expect, afterEach } from 'bun:test'
import { clearPinned, setPinnedToShown } from './pinActions'
import { pageState } from './state'

afterEach(removeFakeState)

function removeFakeState() {
  Reflect.deleteProperty(globalThis, 'document')
  pageState.pinnedId = null
  pageState.isDirty = false
  pageState.versions = []
  pageState.index = 0
}

function installFakeDocument() {
  const pinInfo = { replaceChildren() {}, appendChild() {} }
  const element = { replaceChildren() {}, appendChild() {}, clientHeight: 200 }
  const getById = (id: string) => (id === 'pinInfo' ? pinInfo : element)
  Object.assign(globalThis, { document: { getElementById: getById, createElement: () => ({}) } })
}

function validateSetPinnedToShownPinsTheShownVersionId() {
  installFakeDocument()
  pageState.versions = [{ id: 5, time: 't', state: {}, questions: {}, calls: 0, outputs: [] }, { id: 6, time: 't', state: {}, questions: {}, calls: 0, outputs: [] }]
  pageState.index = 1
  setPinnedToShown()
  expect(pageState.pinnedId).toBe(6)
  expect(pageState.isDirty).toBe(false)
}

function validateClearPinnedUnpins() {
  installFakeDocument()
  pageState.versions = [{ id: 5, time: 't', state: {}, questions: {}, calls: 0, outputs: [] }]
  pageState.pinnedId = 5
  clearPinned()
  expect(pageState.pinnedId).toBeNull()
}

test('test_set_pinned_to_shown_pins_the_shown_version_id_without_dirtying_the_page', validateSetPinnedToShownPinsTheShownVersionId)
test('test_clear_pinned_unpins', validateClearPinnedUnpins)
