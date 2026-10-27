import { test, expect } from 'bun:test'
import { pageState } from './state'

function validatePageStateStartsClean() {
    expect(pageState.isDirty).toBe(false)
    expect(pageState.fileHandle).toBeNull()
    expect(pageState.versions).toEqual([])
}

test('test_page_state_starts_clean', validatePageStateStartsClean)
