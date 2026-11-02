import { test, expect, afterEach } from 'bun:test'
import { clearPinned, setPinnedToShown } from './pinActions'
import { pageState } from './state'

afterEach(removeFakeState)

function removeFakeState() {
  Reflect.deleteProperty(globalThis, 'document')
  Reflect.deleteProperty(globalThis, 'HTMLButtonElement')
  pageState.pinnedIndex = null
  pageState.isDirty = false
  pageState.versions = []
  pageState.index = 0
}

class FakeButton { disabled = false; textContent = '' }

function installFakeDocument() {
  const pinInfo = { replaceChildren() {}, appendChild() {} }
  const element = { replaceChildren() {}, appendChild() {}, clientHeight: 200 }
  const buttons = { pinButton: new FakeButton(), unpinButton: new FakeButton() }
  const getById = (id: string) => (id === 'pinInfo' ? pinInfo : buttons[id as keyof typeof buttons] ?? element)
  Object.assign(globalThis, { document: { getElementById: getById, createElement: () => ({}) }, HTMLButtonElement: FakeButton })
  return buttons
}

function validateSetPinnedToShownPinsTheShownVersionIndex() {
  installFakeDocument()
  pageState.versions = [{ time: 't', state: {}, questions: {}, calls: 0, outputs: [] }, { time: 't', state: {}, questions: {}, calls: 0, outputs: [] }]
  pageState.index = 1
  setPinnedToShown()
  expect(pageState.pinnedIndex).toBe(1)
  expect(pageState.isDirty).toBe(false)
}

function validateClearPinnedUnpins() {
  installFakeDocument()
  pageState.versions = [{ time: 't', state: {}, questions: {}, calls: 0, outputs: [] }]
  pageState.pinnedIndex = 0
  clearPinned()
  expect(pageState.pinnedIndex).toBeNull()
}

function validatePinAndUnpinButtonsFollowThePin() {
  const buttons = installFakeDocument()
  pageState.versions = [{ time: 't', state: {}, questions: {}, calls: 0, outputs: [] }]
  setPinnedToShown()
  expect(buttons.pinButton.disabled).toBe(true)
  expect(buttons.unpinButton.disabled).toBe(false)
  clearPinned()
  expect(buttons.pinButton.disabled).toBe(false)
  expect(buttons.unpinButton.disabled).toBe(true)
}

function validatePinInsteadReplacesThePinFromAnotherVersion() {
  const buttons = installFakeDocument()
  pageState.versions = [{ time: 't', state: {}, questions: {}, calls: 0, outputs: [] }, { time: 't', state: {}, questions: {}, calls: 0, outputs: [] }]
  pageState.index = 1
  pageState.pinnedIndex = 0
  setPinnedToShown()
  expect(pageState.pinnedIndex).toBe(1)
  expect(buttons.pinButton.disabled).toBe(true)
  expect(buttons.pinButton.textContent).toBe('Pin')
  expect(buttons.unpinButton.disabled).toBe(false)
}

test('test_pin_and_unpin_buttons_follow_the_pin', validatePinAndUnpinButtonsFollowThePin)
test('test_pin_instead_replaces_the_pin_from_another_version', validatePinInsteadReplacesThePinFromAnotherVersion)
test('test_set_pinned_to_shown_pins_the_shown_version_index_without_dirtying_the_page', validateSetPinnedToShownPinsTheShownVersionIndex)
test('test_clear_pinned_unpins', validateClearPinnedUnpins)
