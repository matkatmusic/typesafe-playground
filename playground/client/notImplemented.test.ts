import { test, expect } from 'bun:test'
import { triggerNotImplementedError } from './notImplemented'

function validateClickThrowsNotImplemented() {
    expect(triggerNotImplementedError).toThrow('not implemented yet')
}

test('test_not_implemented_click_throws', validateClickThrowsNotImplemented)
