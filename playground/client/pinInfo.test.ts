import { test, expect, afterEach } from 'bun:test'
import { applyPinInfo, listPinLineParts } from './pinInfo'

afterEach(removeFakeDocument)

function removeFakeDocument() {
  Reflect.deleteProperty(globalThis, 'document')
  Reflect.deleteProperty(globalThis, 'HTMLButtonElement')
}

class FakeButton { disabled = false }

function installFakeButtonsDocument() {
  const pinInfo = { replaceChildren() {}, appendChild() {} }
  const buttons = { pinButton: new FakeButton(), unpinButton: new FakeButton() }
  const getById = (id: string) => (id === 'pinInfo' ? pinInfo : buttons[id as keyof typeof buttons])
  Object.assign(globalThis, { document: { getElementById: getById, createElement: () => ({}) }, HTMLButtonElement: FakeButton })
  return buttons
}

function joinPartTexts(pinnedId: number | null) {
  let text = ''
  for (const part of listPinLineParts(pinnedId))
    text += part[0]
  return text
}

function validatePinInfoTextReadsNothingPinnedOrTheVersion() {
  expect(joinPartTexts(null)).toBe('nothing pinned')
  expect(joinPartTexts(7)).toBe('pinned: version 7')
}

function validateApplyPinInfoFillsThePinInfoElement() {
  const children: string[] = []
  const pinInfo = { replaceChildren() { children.length = 0 }, appendChild(child: { textContent: string }) { children.push(child.textContent) } }
  const createElement = () => ({ className: '', textContent: '' })
  const getById = (id: string) => (id === 'pinInfo' ? pinInfo : new FakeButton())
  Object.assign(globalThis, { document: { getElementById: getById, createElement }, HTMLButtonElement: FakeButton })
  applyPinInfo(7)
  expect(children).toEqual(['pinned: version ', '7'])
}

function validateNothingPinnedEnablesPinAndDisablesUnpin() {
  const buttons = installFakeButtonsDocument()
  applyPinInfo(null)
  expect(buttons.pinButton.disabled).toBe(false)
  expect(buttons.unpinButton.disabled).toBe(true)
}

function validatePinnedDisablesPinAndEnablesUnpin() {
  const buttons = installFakeButtonsDocument()
  applyPinInfo(7)
  expect(buttons.pinButton.disabled).toBe(true)
  expect(buttons.unpinButton.disabled).toBe(false)
}

function validateClearingThePinReturnsToTheNothingPinnedState() {
  const buttons = installFakeButtonsDocument()
  applyPinInfo(7)
  applyPinInfo(null)
  expect(buttons.pinButton.disabled).toBe(false)
  expect(buttons.unpinButton.disabled).toBe(true)
}

test('test_pin_info_text_reads_nothing_pinned_or_the_version', validatePinInfoTextReadsNothingPinnedOrTheVersion)
test('test_apply_pin_info_fills_the_pin_info_element', validateApplyPinInfoFillsThePinInfoElement)
test('test_nothing_pinned_enables_pin_and_disables_unpin', validateNothingPinnedEnablesPinAndDisablesUnpin)
test('test_pinned_disables_pin_and_enables_unpin', validatePinnedDisablesPinAndEnablesUnpin)
test('test_clearing_the_pin_returns_to_the_nothing_pinned_state', validateClearingThePinReturnsToTheNothingPinnedState)
