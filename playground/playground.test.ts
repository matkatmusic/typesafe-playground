import { test, expect } from 'bun:test'
import { buildPage, dispatchRequest } from './playground'

const PORT = 4318
const ALLOWED_HOST = `127.0.0.1:${PORT}`

async function validatePageGetReturns200WithHtmlAndNoMarkersLeft() {
    const response = await dispatchRequest(new Request(`http://${ALLOWED_HOST}/`, { headers: { host: ALLOWED_HOST } }), PORT)
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
    const response = await dispatchRequest(new Request(`http://${ALLOWED_HOST}/nope`, { headers: { host: ALLOWED_HOST } }), PORT)
    expect(response.status).toBe(404)
}

async function validateBadHostReturns403() {
    const response = await dispatchRequest(new Request(`http://${ALLOWED_HOST}/`, { headers: { host: 'evil.example:4318' } }), PORT)
    expect(response.status).toBe(403)
}

async function validateBadOriginOnPostReturns403() {
    const headers = { host: ALLOWED_HOST, origin: 'https://evil.example', 'content-type': 'application/json' }
    const response = await dispatchRequest(new Request(`http://${ALLOWED_HOST}/`, { method: 'POST', headers }), PORT)
    expect(response.status).toBe(403)
}

async function validatePageDataReportsWhetherAnEnvKeyExists() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    expect((await buildPage()).includes('{"hasEnvKey":true}')).toBe(true)
    Bun.env.TYPESAFE_API_KEY = '  '
    expect((await buildPage()).includes('{"hasEnvKey":false}')).toBe(true)
    expect((await buildPage()).includes('__DATA_JSON__')).toBe(false)
}

async function validateKeyEditorIsAPasswordInputWithAutocompleteAndSpellcheckOff() {
    const page = await buildPage()
    expect(page.includes('<input id="typeSafeKeyEditor" type="password" autocomplete="off" spellcheck="false"')).toBe(true)
    expect(page.includes('>TypeSafe API key</label>')).toBe(true)
    expect(page.includes('<button id="showKeyButton">Show</button>')).toBe(true)
}

function failCreatingClient(): never {
    throw new Error('client must not be created')
}

async function validateRunPostUsesTheStubClient() {
    Bun.env.TYPESAFE_API_KEY = ''
    const headers = { host: ALLOWED_HOST, origin: `http://${ALLOWED_HOST}`, 'content-type': 'application/json' }
    const noKeyRequest = new Request(`http://${ALLOWED_HOST}/run`, { method: 'POST', headers, body: '{}' })
    const noKeyResponse = await dispatchRequest(noKeyRequest, PORT, failCreatingClient)
    expect(noKeyResponse.status).toBe(400)
    function createStubClient() {
        async function stubSystemOne() {
            return { answers: { requestsAction: { noul: 0.9 } } }
        }
        return { systemOne: stubSystemOne }
    }
    const keyRequest = new Request(`http://${ALLOWED_HOST}/run`, { method: 'POST', headers, body: '{"apiKey":"typed"}' })
    const keyResponse = await dispatchRequest(keyRequest, PORT, createStubClient)
    expect(keyResponse.status).toBe(200)
    expect(await keyResponse.json()).toEqual({ answers: { requestsAction: { noul: 0.9 } } })
}

test('test_page_get_returns_200_html_with_css_filled_in', validatePageGetReturns200WithHtmlAndNoMarkersLeft)
test('test_page_holds_header_version_and_input_results_boxes_in_order', validatePageHoldsThreeBoxesInsidePlaygroundComponentBoxInOrder)
test('test_page_holds_header_buttons_in_order_and_the_client_script', validatePageHoldsHeaderButtonsInOrderAndTheClientScript)
test('test_page_data_reports_whether_an_env_key_exists', validatePageDataReportsWhetherAnEnvKeyExists)
test('test_key_editor_is_a_password_input_with_autocomplete_and_spellcheck_off', validateKeyEditorIsAPasswordInputWithAutocompleteAndSpellcheckOff)
test('test_run_post_uses_the_stub_client', validateRunPostUsesTheStubClient)
test('test_unknown_path_returns_404', validateUnknownPathReturns404)
test('test_bad_host_returns_403', validateBadHostReturns403)
test('test_bad_origin_on_post_returns_403', validateBadOriginOnPostReturns403)
