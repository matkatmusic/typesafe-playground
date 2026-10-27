import { test, expect } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { buildPage } from './playground'
import { initHistory } from './playgroundHistory'

async function buildTempHistoryPath() {
    const historyPath = `${mkdtempSync(`${tmpdir()}/playground-test-`)}/results/playground-history.json`
    await initHistory(historyPath)
    return historyPath
}

async function validateStateAndQuestionsBoxHoldsTwoRowsAndADragBarInOrder() {
    const page = await buildPage(await buildTempHistoryPath())
    const parentIndex = page.indexOf('id="stateAndQuestionsBox"')
    const stateIndex = page.indexOf('id="stateJsonEditor"')
    const barIndex = page.indexOf('id="rowResizer"')
    const questionsIndex = page.indexOf('id="questionsJsonEditor"')
    const columnBarIndex = page.indexOf('id="columnResizer"')
    expect(parentIndex).toBeGreaterThan(page.indexOf('id="errorLine"'))
    expect(parentIndex).toBeLessThan(columnBarIndex)
    expect(stateIndex).toBeGreaterThan(parentIndex)
    expect(barIndex).toBeGreaterThan(stateIndex)
    expect(questionsIndex).toBeGreaterThan(barIndex)
    expect(questionsIndex).toBeLessThan(columnBarIndex)
}

async function validateEachRowStartsWithItsTitleLabelInsideTheSizedBox() {
    const page = await buildPage(await buildTempHistoryPath())
    const stateOpening = '<div id="stateJsonEditor"><span class="other-label">state</span></div>'
    const questionsOpening = '<div id="questionsJsonEditor"><span class="other-label">questions</span>'
    expect(page).toContain(stateOpening)
    expect(page).toContain(questionsOpening)
    expect(page.indexOf(stateOpening)).toBeLessThan(page.indexOf('id="rowResizer"'))
    expect(page.indexOf(questionsOpening)).toBeGreaterThan(page.indexOf('id="rowResizer"'))
}

async function validateTitleLabelColorChangesWithTheTheme() {
    const page = await buildPage(await buildTempHistoryPath())
    const lightColor = page.match(/:root \{[^}]*--label-other: (#\w+);/)?.[1]
    const darkColor = page.match(/:root\[data-theme="dark"\] \{[^}]*--label-other: (#\w+);/)?.[1]
    expect(lightColor).toBeDefined()
    expect(darkColor).toBeDefined()
    expect(lightColor).not.toBe(darkColor)
    expect(page).toContain('.other-label { flex: none; color: var(--label-other); }')
}

async function validateLockGreyCueOnlyMatchesTheLockedContentElement() {
    const page = await buildPage(await buildTempHistoryPath())
    const lockRule = page.split('\n').find((line) => line.includes('opacity: 0.5') && line.includes('.cm-editor:has('))
    expect(lockRule).toBeDefined()
    expect(lockRule).toContain('.cm-editor:has(> .cm-scroller > .cm-content[contenteditable="false"])')
    expect(lockRule).not.toContain('has([contenteditable')
}

async function validatePlaceholderHighlightDoesNotChangeTheTextBox() {
    const page = await buildPage(await buildTempHistoryPath())
    const rule = page.split('\n').find((line) => line.startsWith('#questionsJsonEditor .cm-placeholderValue {'))
    expect(rule).toBeDefined()
    expect(rule).toContain('outline: 1px dashed')
    for (const boxProperty of ['border:', 'padding', 'margin', 'display', 'line-height', 'font-size'])
        expect(rule).not.toContain(boxProperty)
}

test('test_placeholder_highlight_does_not_change_the_text_box', validatePlaceholderHighlightDoesNotChangeTheTextBox)
test('test_lock_grey_cue_only_matches_the_locked_content_element', validateLockGreyCueOnlyMatchesTheLockedContentElement)
test('test_each_row_starts_with_its_title_label_inside_the_sized_box', validateEachRowStartsWithItsTitleLabelInsideTheSizedBox)
test('test_title_label_color_changes_with_the_theme', validateTitleLabelColorChangesWithTheTheme)
test('test_state_and_questions_box_holds_two_rows_and_a_drag_bar_in_order', validateStateAndQuestionsBoxHoldsTwoRowsAndADragBarInOrder)
