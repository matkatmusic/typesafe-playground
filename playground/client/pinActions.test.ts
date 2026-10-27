import { test, expect, afterEach } from 'bun:test'
import { clearPinned, setPinnedToShown } from './pinActions'
import { pageState } from './state'

afterEach(removeFakeState)

function removeFakeState() {
  Reflect.deleteProperty(globalThis, 'document')
  Reflect.deleteProperty(globalThis, 'HTMLButtonElement')
  pageState.pinnedId = null
  pageState.isDirty = false
  pageState.versions = []
  pageState.index = 0
}

class FakeButton { disabled = false }

function installFakeDocument() {
  const pinInfo = { replaceChildren() {}, appendChild() {} }
  const element = { replaceChildren() {}, appendChild() {}, clientHeight: 200 }
  const buttons = { pinButton: new FakeButton(), unpinButton: new FakeButton() }
  const getById = (id: string) => (id === 'pinInfo' ? pinInfo : buttons[id as keyof typeof buttons] ?? element)
  Object.assign(globalThis, { document: { getElementById: getById, createElement: () => ({}) }, HTMLButtonElement: FakeButton })
  return buttons
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

function validatePinAndUnpinButtonsFollowThePin() {
  const buttons = installFakeDocument()
  pageState.versions = [{ id: 5, time: 't', state: {}, questions: {}, calls: 0, outputs: [] }]
  setPinnedToShown()
  expect(buttons.pinButton.disabled).toBe(true)
  expect(buttons.unpinButton.disabled).toBe(false)
  clearPinned()
  expect(buttons.pinButton.disabled).toBe(false)
  expect(buttons.unpinButton.disabled).toBe(true)
}

function validateSetPinnedToShownWhilePinnedKeepsTheOldPin() {
  installFakeDocument()
  pageState.versions = [{ id: 5, time: 't', state: {}, questions: {}, calls: 0, outputs: [] }, { id: 6, time: 't', state: {}, questions: {}, calls: 0, outputs: [] }]
  pageState.index = 1
  pageState.pinnedId = 5
  setPinnedToShown()
  expect(pageState.pinnedId).toBe(5)
}

test('test_pin_and_unpin_buttons_follow_the_pin', validatePinAndUnpinButtonsFollowThePin)
test('test_set_pinned_to_shown_while_pinned_keeps_the_old_pin', validateSetPinnedToShownWhilePinnedKeepsTheOldPin)
test('test_set_pinned_to_shown_pins_the_shown_version_id_without_dirtying_the_page', validateSetPinnedToShownPinsTheShownVersionId)
test('test_clear_pinned_unpins', validateClearPinnedUnpins)
