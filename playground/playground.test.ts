import { test, expect } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { buildPage, dispatchRequest } from './playground'
import { initHistory } from './playgroundHistory'

const PORT = 4318
const ALLOWED_HOST = `127.0.0.1:${PORT}`

async function buildTempHistoryPath() {
    const historyPath = `${mkdtempSync(`${tmpdir()}/playground-test-`)}/results/playground-history.json`
    await initHistory(historyPath)
    return historyPath
}

async function validatePageGetReturns200WithHtmlAndNoMarkersLeft() {
    const historyPath = await buildTempHistoryPath()
    const response = await dispatchRequest(new Request(`http://${ALLOWED_HOST}/`, { headers: { host: ALLOWED_HOST } }), PORT, historyPath)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8')
    const page = await response.text()
    expect(page.includes('__PAGE_CSS__')).toBe(false)
    expect(page).toBe(await buildPage(historyPath))
}

async function validatePageHoldsThreeBoxesInsidePlaygroundComponentBoxInOrder() {
    const page = await buildPage(await buildTempHistoryPath())
    const componentIndex = page.indexOf('id="playgroundComponentBox"')
    const headerIndex = page.indexOf('id="headerBox"')
    const versionIndex = page.indexOf('id="versionBox"')
    const inputResultsIndex = page.indexOf('id="inputResultsBox"')
    expect(componentIndex).toBeGreaterThan(-1)
    expect(headerIndex).toBeGreaterThan(componentIndex)
    expect(versionIndex).toBeGreaterThan(headerIndex)
    expect(inputResultsIndex).toBeGreaterThan(versionIndex)
}

async function validatePageHoldsHeaderButtonsInOrderAndTheClientScript() {
    const page = await buildPage(await buildTempHistoryPath())
    const buttonIds = ['newButton', 'openButton', 'saveButton', 'resetButton', 'typeSafeKeyLabel', 'typeSafeKeyEditor', 'showKeyButton', 'lightDarkModeButton']
    let previousIndex = page.indexOf('id="headerBox"')
    for (const buttonId of buttonIds) {
        const buttonIndex = page.indexOf(`id="${buttonId}"`)
        expect(buttonIndex).toBeGreaterThan(previousIndex)
        previousIndex = buttonIndex
    }
    expect(page.includes('__PAGE_SCRIPT__')).toBe(false)
    expect(page.includes('<script type="module">')).toBe(true)
    expect(page.includes('lightDarkModeButton')).toBe(true)
}

async function validateUnknownPathReturns404() {
    const historyPath = await buildTempHistoryPath()
    const response = await dispatchRequest(new Request(`http://${ALLOWED_HOST}/nope`, { headers: { host: ALLOWED_HOST } }), PORT, historyPath)
    expect(response.status).toBe(404)
}

async function validateBadHostReturns403() {
    const historyPath = await buildTempHistoryPath()
    const response = await dispatchRequest(new Request(`http://${ALLOWED_HOST}/`, { headers: { host: 'evil.example:4318' } }), PORT, historyPath)
    expect(response.status).toBe(403)
}

async function validateBadOriginOnPostReturns403() {
    const historyPath = await buildTempHistoryPath()
    const headers = { host: ALLOWED_HOST, origin: 'https://evil.example', 'content-type': 'application/json' }
    const response = await dispatchRequest(new Request(`http://${ALLOWED_HOST}/`, { method: 'POST', headers }), PORT, historyPath)
    expect(response.status).toBe(403)
}

async function validatePageDataHoldsVersionsAndWhetherAnEnvKeyExists() {
    const historyPath = await buildTempHistoryPath()
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const page = await buildPage(historyPath)
    expect(page.includes('{"versions":[{"id":1,')).toBe(true)
    expect(page.includes('"hasEnvKey":true}')).toBe(true)
    Bun.env.TYPESAFE_API_KEY = '  '
    expect((await buildPage(historyPath)).includes('"hasEnvKey":false}')).toBe(true)
    expect((await buildPage(historyPath)).includes('__DATA_JSON__')).toBe(false)
}

async function validateKeyEditorIsAPasswordInputWithAutocompleteAndSpellcheckOff() {
    const page = await buildPage(await buildTempHistoryPath())
    expect(page.includes('<input id="typeSafeKeyEditor" type="password" autocomplete="off" spellcheck="false"')).toBe(true)
    expect(page.includes('>TypeSafe API key</label>')).toBe(true)
    expect(page.includes('<button id="showKeyButton">Show</button>')).toBe(true)
}

async function validateCostTokenSubmitBoxHoldsFourItemsInOrderAndErrorLineFollows() {
    const page = await buildPage(await buildTempHistoryPath())
    const boxIndex = page.indexOf('id="costTokenSubmitBox"')
    const itemIds = ['costLabel', 'tokensLabel', 'callsPicker', 'submitButton', 'errorLine']
    expect(boxIndex).toBeGreaterThan(page.indexOf('id="inputBox"'))
    let previousIndex = boxIndex
    for (const itemId of itemIds) {
        const itemIndex = page.indexOf(`id="${itemId}"`)
        expect(itemIndex).toBeGreaterThan(previousIndex)
        previousIndex = itemIndex
    }
    expect(page.includes('<button id="submitButton">Submit (paid)</button>')).toBe(true)
    expect(page.includes('<label id="callsLabel" for="callsPicker">Calls</label>')).toBe(true)
    expect(page.indexOf('id="callsLabel"')).toBeLessThan(page.indexOf('id="callsPicker"'))
    expect(page).toContain('#callsSubmitGroup #submitButton { height: 30px; margin-left: -1px; border-radius: 0 6px 6px 0; }')
}

test('test_page_get_returns_200_html_with_css_filled_in', validatePageGetReturns200WithHtmlAndNoMarkersLeft)
test('test_page_holds_header_version_and_input_results_boxes_in_order', validatePageHoldsThreeBoxesInsidePlaygroundComponentBoxInOrder)
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
    const itemIds = ['resultBox', 'winnerBox', 'jsonToggleButton', 'graphContainerBox', 'resultJsonEditor']
    let previousIndex = -1
    for (const itemId of itemIds) {
        const itemIndex = page.indexOf(`id="${itemId}"`)
        expect(itemIndex).toBeGreaterThan(previousIndex)
        previousIndex = itemIndex
    }
}

test('test_result_box_holds_winners_first_then_toggle_graphs_and_json', validateResultBoxHoldsWinnersFirstThenToggleGraphsAndJson)
test('test_page_holds_header_buttons_in_order_and_the_client_script',validatePageHoldsHeaderButtonsInOrderAndTheClientScript)
test('test_page_data_holds_versions_and_whether_an_env_key_exists', validatePageDataHoldsVersionsAndWhetherAnEnvKeyExists)
test('test_key_editor_is_a_password_input_with_autocomplete_and_spellcheck_off', validateKeyEditorIsAPasswordInputWithAutocompleteAndSpellcheckOff)
test('test_cost_token_submit_box_holds_four_items_in_order_and_error_line_follows', validateCostTokenSubmitBoxHoldsFourItemsInOrderAndErrorLineFollows)
test('test_unknown_path_returns_404', validateUnknownPathReturns404)
test('test_bad_host_returns_403', validateBadHostReturns403)
test('test_bad_origin_on_post_returns_403', validateBadOriginOnPostReturns403)
