import { test, expect, afterEach } from 'bun:test'
import { applyPinButtons, computePinButtonText, PIN_INSTEAD_TEXT, PIN_TEXT } from './pinButtons'
import { pageState } from './state'

afterEach(removeFakeState)

function removeFakeState() {
  Reflect.deleteProperty(globalThis, 'document')
  Reflect.deleteProperty(globalThis, 'HTMLButtonElement')
  pageState.pinnedId = null
  pageState.versions = []
  pageState.index = 0
}

class FakeButton { disabled = false; textContent = '' }

function installFakeButtons(pinnedId: number | null, shownIndex: number) {
  const buttons = { pinButton: new FakeButton(), unpinButton: new FakeButton() }
  const getById = (id: string) => buttons[id as keyof typeof buttons]
  Object.assign(globalThis, { document: { getElementById: getById }, HTMLButtonElement: FakeButton })
  pageState.versions = [{ id: 5, time: 't', state: {}, questions: {}, calls: 0, outputs: [] }, { id: 6, time: 't', state: {}, questions: {}, calls: 0, outputs: [] }]
  pageState.index = shownIndex
  pageState.pinnedId = pinnedId
  return buttons
}

function validateNothingPinnedEnablesPinAndDisablesUnpin() {
  const buttons = installFakeButtons(null, 0)
  applyPinButtons()
  expect(buttons.pinButton.disabled).toBe(false)
  expect(buttons.pinButton.textContent).toBe(PIN_TEXT)
  expect(buttons.unpinButton.disabled).toBe(true)
}

function validateShownVersionPinnedDisablesPinAndEnablesUnpin() {
  const buttons = installFakeButtons(5, 0)
  applyPinButtons()
  expect(buttons.pinButton.disabled).toBe(true)
  expect(buttons.pinButton.textContent).toBe(PIN_TEXT)
  expect(buttons.unpinButton.disabled).toBe(false)
}

function validateOtherVersionPinnedEnablesPinInsteadAndUnpin() {
  const buttons = installFakeButtons(5, 1)
  applyPinButtons()
  expect(buttons.pinButton.disabled).toBe(false)
  expect(buttons.pinButton.textContent).toBe(PIN_INSTEAD_TEXT)
  expect(buttons.unpinButton.disabled).toBe(false)
}

function validateButtonTextFollowsTheShownVersion() {
  expect(computePinButtonText(null, 6)).toBe('Pin')
  expect(computePinButtonText(6, 6)).toBe('Pin')
  expect(computePinButtonText(5, 6)).toBe('Pin this version instead')
}

test('test_nothing_pinned_enables_pin_and_disables_unpin', validateNothingPinnedEnablesPinAndDisablesUnpin)
test('test_shown_version_pinned_disables_pin_and_enables_unpin', validateShownVersionPinnedDisablesPinAndEnablesUnpin)
test('test_other_version_pinned_enables_pin_instead_and_unpin', validateOtherVersionPinnedEnablesPinInsteadAndUnpin)
test('test_button_text_follows_the_shown_version', validateButtonTextFollowsTheShownVersion)
