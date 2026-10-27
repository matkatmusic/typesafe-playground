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

async function validateInputResultsBoxHoldsInputBoxDragBarAndResultBoxInOrder() {
    const page = await buildPage(await buildTempHistoryPath())
    const parentIndex = page.indexOf('id="inputResultsBox"')
    const inputIndex = page.indexOf('id="inputBox"')
    const barIndex = page.indexOf('id="columnResizer"')
    const resultIndex = page.indexOf('id="resultBox"')
    expect(inputIndex).toBeGreaterThan(parentIndex)
    expect(barIndex).toBeGreaterThan(inputIndex)
    expect(resultIndex).toBeGreaterThan(barIndex)
}

test('test_input_results_box_holds_input_box_drag_bar_and_result_box_in_order', validateInputResultsBoxHoldsInputBoxDragBarAndResultBoxInOrder)

async function validateResultBoxHoldsWinnersFirstThenToggleGraphsAndJson() {
    const page = await buildPage(await buildTempHistoryPath())
    const itemIds = ['resultBox', 'winnerBox', 'collapseAllButton', 'expandAllButton', 'jsonToggleButton', 'graphContainerBox', 'resultJsonEditor']
    let previousIndex = -1
    for (const itemId of itemIds) {
        const itemIndex = page.indexOf(`id="${itemId}"`)
        expect(itemIndex).toBeGreaterThan(previousIndex)
        previousIndex = itemIndex
    }
}

async function validateButtonBorderIsStrongInBothThemes() {
    const page = await buildPage(await buildTempHistoryPath())
    const lightColor = page.match(/:root \{[^}]*--button-border: (#\w+);/)?.[1]
    const darkColor = page.match(/:root\[data-theme="dark"\] \{[^}]*--button-border: (#\w+);/)?.[1]
    expect(lightColor).toBeDefined()
    expect(darkColor).toBeDefined()
    expect(lightColor).not.toBe(darkColor)
    expect(page).toContain('border: 2px solid var(--button-border); border-radius: 6px; padding: 4px 12px;')
    expect(page).not.toMatch(/^[^{}\n]*\bbutton\b[^{}\n]*\{[^{}]*border: 1px solid var\(--grid\)/m)
}

test('test_button_border_is_strong_in_both_themes', validateButtonBorderIsStrongInBothThemes)

async function validatePressedButtonMovesDownAndRightBy2px() {
    const page = await buildPage(await buildTempHistoryPath())
    expect(page).toContain('button:active:not(:disabled) { transform: translate(2px, 2px); }')
}

test('test_pressed_button_moves_down_and_right_by_2px', validatePressedButtonMovesDownAndRightBy2px)

async function validateNoteBoxSitsAboveTheStateAndQuestionsBox() {
    const page = await buildPage(await buildTempHistoryPath())
    expect(page.indexOf('id="noteBox"')).toBeGreaterThan(page.indexOf('id="errorLine"'))
    expect(page.indexOf('id="noteText"')).toBeGreaterThan(page.indexOf('id="noteBox"'))
    expect(page.indexOf('id="noteText"')).toBeLessThan(page.indexOf('id="stateAndQuestionsBox"'))
}

test('test_note_box_sits_above_the_state_and_questions_box', validateNoteBoxSitsAboveTheStateAndQuestionsBox)
test('test_result_box_holds_winners_first_then_toggle_graphs_and_json', validateResultBoxHoldsWinnersFirstThenToggleGraphsAndJson)
