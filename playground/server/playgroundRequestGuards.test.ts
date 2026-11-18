import { test, expect } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { buildPage, dispatchRequest } from './playground';
import { initHistory } from '../history/playgroundHistory';

function getPort() {
    return 4318;
}

function getAllowedHost() {
    return `127.0.0.1:${getPort()}`;
}

async function buildTempHistoryPath() {
    const historyPath = `${mkdtempSync(`${tmpdir()}/playground-test-`)}/results/playground-history.json`;
    await initHistory(historyPath);
    return historyPath;
}

async function validatePageGetReturns200WithHtmlAndNoMarkersLeft() {
    const historyPath = await buildTempHistoryPath();
    const response = await dispatchRequest(new Request(`http://${getAllowedHost()}/`, { headers: { host: getAllowedHost() } }), getPort(), historyPath);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
    const page = await response.text();
    expect(page.includes('__PAGE_CSS__')).toBe(false);
    expect(page).toBe(await buildPage(historyPath));
}

async function validateUnknownPathReturns404() {
    const historyPath = await buildTempHistoryPath();
    const response = await dispatchRequest(new Request(`http://${getAllowedHost()}/nope`, { headers: { host: getAllowedHost() } }), getPort(), historyPath);
    expect(response.status).toBe(404);
}

async function validateBadHostReturns403() {
    const historyPath = await buildTempHistoryPath();
    const response = await dispatchRequest(new Request(`http://${getAllowedHost()}/`, { headers: { host: 'evil.example:4318' } }), getPort(), historyPath);
    expect(response.status).toBe(403);
}

async function validateBadOriginOnPostReturns403() {
    const historyPath = await buildTempHistoryPath();
    const headers = { host: getAllowedHost(), origin: 'https://evil.example', 'content-type': 'application/json' };
    const response = await dispatchRequest(new Request(`http://${getAllowedHost()}/`, { method: 'POST', headers }), getPort(), historyPath);
    expect(response.status).toBe(403);
}

test('test_page_get_returns_200_html_with_css_filled_in', validatePageGetReturns200WithHtmlAndNoMarkersLeft);
test('test_unknown_path_returns_404', validateUnknownPathReturns404);
test('test_bad_host_returns_403', validateBadHostReturns403);
test('test_bad_origin_on_post_returns_403', validateBadOriginOnPostReturns403);
