import { test, expect } from 'bun:test'
import { getShownVersion, pageState } from './state'

function validatePageStateStartsClean() {
    expect(pageState.isDirty).toBe(false)
    expect(pageState.fileHandle).toBeNull()
    expect(pageState.versions).toEqual([])
    expect(pageState.index).toBe(0)
    expect(pageState.pinnedId).toBeNull()
}

function validateShownVersionFollowsTheIndex() {
    const first = { id: 1, time: 'a', state: {}, questions: {}, calls: 0, outputs: [] }
    const second = { id: 2, time: 'b', state: {}, questions: {}, calls: 0, outputs: [] }
    pageState.versions = [first, second]
    pageState.index = 1
    expect(getShownVersion()).toBe(second)
    pageState.versions = []
    pageState.index = 0
}

test('test_page_state_starts_clean', validatePageStateStartsClean)
test('test_shown_version_follows_the_index', validateShownVersionFollowsTheIndex)
