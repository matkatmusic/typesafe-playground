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
    expect(page).toContain('border: 1px solid var(--button-border); border-radius: 6px; padding: 4px 12px;')
    expect(page).not.toContain('2px solid var(--button-border)')
    expect(page).not.toMatch(/^[^{}\n]*\bbutton\b[^{}\n]*\{[^{}]*border: 1px solid var\(--grid\)/m)
}

test('test_button_border_is_strong_in_both_themes', validateButtonBorderIsStrongInBothThemes)

async function validatePressedButtonMovesDownAndRightBy2px() {
    const page = await buildPage(await buildTempHistoryPath())
    expect(page).toContain('button:active:not(:disabled) { transform: translate(2px, 2px); }')
}

test('test_pressed_button_moves_down_and_right_by_2px', validatePressedButtonMovesDownAndRightBy2px)

async function validateNoteBoxSitsInTheVersionRowAfterTheNextButtonWithADivider() {
    const page = await buildPage(await buildTempHistoryPath())
    const itemIds = ['versionBox', 'prevVersionButton', 'versionLabel', 'nextVersionButton', 'versionNoteDivider', 'noteBox', 'noteText']
    let previousIndex = -1
    for (const itemId of itemIds) {
        const itemIndex = page.indexOf(`id="${itemId}"`)
        expect(itemIndex).toBeGreaterThan(previousIndex)
        previousIndex = itemIndex
    }
    expect(page.indexOf('id="noteText"')).toBeLessThan(page.indexOf('id="inputResultsBox"'))
    expect(page).toContain('#versionNoteDivider { flex: none; align-self: stretch; width: 1px; margin: 0 4px; background: var(--grid); }')
}

test('test_note_box_sits_in_the_version_row_after_the_next_button_with_a_divider', validateNoteBoxSitsInTheVersionRowAfterTheNextButtonWithADivider)
async function validateJsonToggleButtonSaysBracesAndShowsAShowResponseTooltip() {
    const page = await buildPage(await buildTempHistoryPath())
    expect(page).toContain('<button id="jsonToggleButton" aria-label="show response" title="show response">{ }</button>')
}

async function validateJsonToggleButtonStretchesToTheHeightOfCollapseAndExpand() {
    const page = await buildPage(await buildTempHistoryPath())
    const rule = page.split('\n').find((line) => line.startsWith('#jsonToggleButton {'))
    expect(rule).toContain('align-self: stretch')
    expect(rule).not.toContain('height:')
}

async function validateReplaceReferencesToggleIsAnUncheckedCheckboxInTheButtonRow() {
    const page = await buildPage(await buildTempHistoryPath())
    const toggle = '<label id="replaceReferencesToggle"><input type="checkbox" id="replaceReferencesCheckbox"> replace references</label>'
    expect(page).toContain(toggle)
    expect(page.indexOf(toggle)).toBeGreaterThan(page.indexOf('id="graphButtonRow"'))
    expect(page.indexOf(toggle)).toBeLessThan(page.indexOf('id="collapseAllButton"'))
}

test('test_replace_references_toggle_is_an_unchecked_checkbox_in_the_button_row', validateReplaceReferencesToggleIsAnUncheckedCheckboxInTheButtonRow)
async function validateGraphsScrollWithAStyledScrollbarAndInfoBoxSitsInTheBlockFlow() {
    const page = await buildPage(await buildTempHistoryPath())
    const lines = page.split('\n')
    const containerRule = lines.find((line) => line.startsWith('#graphContainerBox {'))
    expect(containerRule).toContain('overflow-y: auto')
    expect(containerRule).toContain('scrollbar-gutter: stable')
    expect(page).toContain('#graphContainerBox::-webkit-scrollbar { width: 10px; }')
    expect(page).toContain('#graphContainerBox::-webkit-scrollbar-track { background: var(--grid);')
    expect(page).toContain('#graphContainerBox::-webkit-scrollbar-thumb { background: var(--text-muted);')
    const blockRule = lines.find((line) => line.startsWith('.graph-block {'))
    expect(blockRule).toContain('display: grid')
    expect(blockRule).not.toContain('min-height: 0')
    const infoRule = lines.find((line) => line.startsWith('.bar-info {'))
    expect(infoRule).toContain('grid-column: 2')
    expect(infoRule).not.toContain('position: absolute')
}

test('test_graphs_scroll_with_a_styled_scrollbar_and_info_box_sits_in_the_block_flow', validateGraphsScrollWithAStyledScrollbarAndInfoBoxSitsInTheBlockFlow)
test('test_json_toggle_button_stretches_to_the_height_of_collapse_and_expand', validateJsonToggleButtonStretchesToTheHeightOfCollapseAndExpand)
test('test_json_toggle_button_says_braces_and_shows_a_show_response_tooltip', validateJsonToggleButtonSaysBracesAndShowsAShowResponseTooltip)
test('test_result_box_holds_winners_first_then_toggle_graphs_and_json', validateResultBoxHoldsWinnersFirstThenToggleGraphsAndJson)
