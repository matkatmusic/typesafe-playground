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

test('test_state_and_questions_box_holds_two_rows_and_a_drag_bar_in_order', validateStateAndQuestionsBoxHoldsTwoRowsAndADragBarInOrder)
