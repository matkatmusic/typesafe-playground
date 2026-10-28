import { test, expect, afterEach } from 'bun:test'
import { pageState } from './state'
import { notifyOnUnsavedClose } from './unsavedClose'

afterEach(() => {
  pageState.isDirty = false
})

function buildStubEvent() {
  const stub = { preventDefaultCount: 0, preventDefault() { stub.preventDefaultCount += 1 } }
  return stub
}

function validateDirtyStateCallsPreventDefault() {
  pageState.isDirty = true
  const event = buildStubEvent()
  notifyOnUnsavedClose(event as unknown as BeforeUnloadEvent)
  expect(event.preventDefaultCount).toBe(1)
}

function validateCleanStateDoesNotCallPreventDefault() {
  pageState.isDirty = false
  const event = buildStubEvent()
  notifyOnUnsavedClose(event as unknown as BeforeUnloadEvent)
  expect(event.preventDefaultCount).toBe(0)
}

test('test_dirty_state_calls_prevent_default', validateDirtyStateCallsPreventDefault)
test('test_clean_state_does_not_call_prevent_default', validateCleanStateDoesNotCallPreventDefault)
