import { test, expect, afterEach, setSystemTime } from 'bun:test'
import { markPageChanged } from './pageChanged'
import { pageState } from './state'

class FakeBox { textContent = '' }

afterEach(removeFakeState)

function removeFakeState() {
    Reflect.deleteProperty(globalThis, 'document')
    setSystemTime()
    pageState.isDirty = false
}

function validateMarkingTheChangeSetsDirtyAndShowsTheTime() {
    const lastEditedLabel = new FakeBox()
    Object.assign(globalThis, { document: { getElementById: () => lastEditedLabel } })
    const changeTime = new Date(2026, 9, 27, 13, 5, 9)
    setSystemTime(changeTime)
    expect(lastEditedLabel.textContent).toBe('')
    markPageChanged()
    expect(pageState.isDirty).toBe(true)
    expect(lastEditedLabel.textContent).toBe(`last edited: ${changeTime.toLocaleString()}`)
}

function validateEachChangeMovesTheTimeForward() {
    const lastEditedLabel = new FakeBox()
    Object.assign(globalThis, { document: { getElementById: () => lastEditedLabel } })
    setSystemTime(new Date(2026, 9, 27, 13, 5, 9))
    markPageChanged()
    const firstText = lastEditedLabel.textContent
    setSystemTime(new Date(2026, 9, 27, 14, 6, 10))
    markPageChanged()
    expect(lastEditedLabel.textContent).not.toBe(firstText)
}

test('test_marking_the_change_sets_dirty_and_shows_the_time', validateMarkingTheChangeSetsDirtyAndShowsTheTime)
test('test_each_change_moves_the_time_forward', validateEachChangeMovesTheTimeForward)
