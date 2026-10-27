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

function installFakeLabel() {
    const lastEditedLabel = new FakeBox()
    Object.assign(globalThis, { document: { getElementById: () => lastEditedLabel } })
    return lastEditedLabel
}

function validateMarkingTheChangeSetsDirtyAndShowsTheWordAndTime() {
    const lastEditedLabel = installFakeLabel()
    const changeTime = new Date(2026, 9, 27, 13, 5, 9)
    setSystemTime(changeTime)
    expect(lastEditedLabel.textContent).toBe('')
    markPageChanged('last edited')
    expect(pageState.isDirty).toBe(true)
    expect(lastEditedLabel.textContent).toBe(`last edited: ${changeTime.toLocaleString()}`)
}

function validateARunThenAnEditChangesTheWordBack() {
    const lastEditedLabel = installFakeLabel()
    const runTime = new Date(2026, 9, 27, 13, 5, 9)
    setSystemTime(runTime)
    markPageChanged('last run')
    expect(lastEditedLabel.textContent).toBe(`last run: ${runTime.toLocaleString()}`)
    const editTime = new Date(2026, 9, 27, 14, 6, 10)
    setSystemTime(editTime)
    markPageChanged('last edited')
    expect(lastEditedLabel.textContent).toBe(`last edited: ${editTime.toLocaleString()}`)
}

test('test_marking_the_change_sets_dirty_and_shows_the_word_and_time', validateMarkingTheChangeSetsDirtyAndShowsTheWordAndTime)
test('test_a_run_then_an_edit_changes_the_word_back', validateARunThenAnEditChangesTheWordBack)
