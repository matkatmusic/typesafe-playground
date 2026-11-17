import { test, expect, afterEach } from 'bun:test'
import { applyPinInfo, listPinLineParts } from './pinInfo'

afterEach(removeFakeDocument)

function removeFakeDocument() {
  Reflect.deleteProperty(globalThis, 'document')
}

function joinPartTexts(pinnedIndex: number | null) {
  let text = ''
  for (const part of listPinLineParts(pinnedIndex))
    text += part[0]
  return text
}

function validatePinInfoTextReadsNothingPinnedOrTheVersion() {
  expect(joinPartTexts(null)).toBe('nothing pinned')
  expect(joinPartTexts(7)).toBe('pinned: version 8')
}

function validateApplyPinInfoFillsThePinInfoElement() {
  const children: string[] = []
  const pinInfo = { replaceChildren() { children.length = 0 }, appendChild(child: { textContent: string }) { children.push(child.textContent) } }
  const createElement = () => ({ className: '', textContent: '' })
  Object.assign(globalThis, { document: { getElementById: () => pinInfo, createElement } })
  applyPinInfo(7)
  expect(children).toEqual(['pinned: version ', '8'])
}

test('test_pin_info_text_reads_nothing_pinned_or_the_version', validatePinInfoTextReadsNothingPinnedOrTheVersion)
test('test_apply_pin_info_fills_the_pin_info_element', validateApplyPinInfoFillsThePinInfoElement)
