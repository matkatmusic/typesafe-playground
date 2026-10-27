import { test, expect } from 'bun:test'
import { buildPage, handleRequest } from './playground'

const PORT = 4318
const ALLOWED_HOST = `127.0.0.1:${PORT}`

async function validatePageGetReturns200WithHtmlAndNoMarkersLeft() {
    const response = await handleRequest(new Request(`http://${ALLOWED_HOST}/`, { headers: { host: ALLOWED_HOST } }), PORT)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8')
    const page = await response.text()
    expect(page.includes('__PAGE_CSS__')).toBe(false)
    expect(page).toBe(await buildPage())
}

async function validatePageHoldsThreeBoxesInsidePlaygroundComponentBoxInOrder() {
    const page = await buildPage()
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
    const page = await buildPage()
    const buttonIds = ['newButton', 'openButton', 'saveButton', 'resetButton', 'lightDarkModeButton']
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
    const response = await handleRequest(new Request(`http://${ALLOWED_HOST}/nope`, { headers: { host: ALLOWED_HOST } }), PORT)
    expect(response.status).toBe(404)
}

async function validateBadHostReturns403() {
    const response = await handleRequest(new Request(`http://${ALLOWED_HOST}/`, { headers: { host: 'evil.example:4318' } }), PORT)
    expect(response.status).toBe(403)
}

async function validateBadOriginOnPostReturns403() {
    const headers = { host: ALLOWED_HOST, origin: 'https://evil.example', 'content-type': 'application/json' }
    const response = await handleRequest(new Request(`http://${ALLOWED_HOST}/`, { method: 'POST', headers }), PORT)
    expect(response.status).toBe(403)
}

test('test_page_get_returns_200_html_with_css_filled_in', validatePageGetReturns200WithHtmlAndNoMarkersLeft)
test('test_page_holds_header_version_and_input_results_boxes_in_order', validatePageHoldsThreeBoxesInsidePlaygroundComponentBoxInOrder)
test('test_page_holds_header_buttons_in_order_and_the_client_script', validatePageHoldsHeaderButtonsInOrderAndTheClientScript)
test('test_unknown_path_returns_404', validateUnknownPathReturns404)
test('test_bad_host_returns_403', validateBadHostReturns403)
test('test_bad_origin_on_post_returns_403', validateBadOriginOnPostReturns403)
