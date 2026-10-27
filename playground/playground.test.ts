import { test, expect } from 'bun:test'
import { buildPage, handleRequest } from './playground'

const ALLOWED_HOST = '127.0.0.1:4318'

async function validatePageGetReturns200WithHtmlAndNoMarkersLeft() {
    const response = await handleRequest(new Request(`http://${ALLOWED_HOST}/`, { headers: { host: ALLOWED_HOST } }))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8')
    const page = await response.text()
    expect(page.includes('__PAGE_CSS__')).toBe(false)
    expect(page).toBe(await buildPage())
}

async function validateUnknownPathReturns404() {
    const response = await handleRequest(new Request(`http://${ALLOWED_HOST}/nope`, { headers: { host: ALLOWED_HOST } }))
    expect(response.status).toBe(404)
}

async function validateBadHostReturns403() {
    const response = await handleRequest(new Request(`http://${ALLOWED_HOST}/`, { headers: { host: 'evil.example:4318' } }))
    expect(response.status).toBe(403)
}

async function validateBadOriginOnPostReturns403() {
    const headers = { host: ALLOWED_HOST, origin: 'https://evil.example', 'content-type': 'application/json' }
    const response = await handleRequest(new Request(`http://${ALLOWED_HOST}/`, { method: 'POST', headers }))
    expect(response.status).toBe(403)
}

test('test_page_get_returns_200_html_with_css_filled_in', validatePageGetReturns200WithHtmlAndNoMarkersLeft)
test('test_unknown_path_returns_404', validateUnknownPathReturns404)
test('test_bad_host_returns_403', validateBadHostReturns403)
test('test_bad_origin_on_post_returns_403', validateBadOriginOnPostReturns403)
