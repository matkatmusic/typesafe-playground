import { test, expect } from 'bun:test';
import { buildPage, dispatchRequest } from './playground';
import { getPort, getOpenedVersion, buildTempHistoryPath, buildPostRequest } from './playgroundVersionRequestsSupport';

async function validateOpenThenSaveRoundTripsThroughTheTempFile() {
    const historyPath = await buildTempHistoryPath();
    const openResponse = await dispatchRequest(buildPostRequest('/open', { versions: [getOpenedVersion()] }), getPort(), historyPath);
    expect(openResponse.status).toBe(200);
    const saveResponse = await dispatchRequest(buildPostRequest('/save', {}), getPort(), historyPath);
    expect(await saveResponse.json()).toEqual({ versions: [getOpenedVersion()] });
}

async function validateOpenReturnsVersionsWithoutIdKeys() {
    const historyPath = await buildTempHistoryPath();
    const response = await dispatchRequest(buildPostRequest('/open', { versions: [{ ...getOpenedVersion(), id: 7 }] }), getPort(), historyPath);
    expect(response.status).toBe(200);
    const opened = (await response.json()) as { versions: object[] };
    expect(opened.versions.length).toBe(1);
    expect('id' in opened.versions[0]).toBe(false);
}

async function validateOpenRejectsBadVersions() {
    const historyPath = await buildTempHistoryPath();
    const emptyResponse = await dispatchRequest(buildPostRequest('/open', { versions: [] }), getPort(), historyPath);
    expect(emptyResponse.status).toBe(400);
    const badResponse = await dispatchRequest(buildPostRequest('/open', { versions: [{ id: 'x' }] }), getPort(), historyPath);
    expect(badResponse.status).toBe(400);
}

async function validatePageHoldsTheUnsavedDialogAndAnUntitledTitle() {
    const page = await buildPage(await buildTempHistoryPath());
    expect(page.includes('id="unsavedDialog"')).toBe(true);
    expect(page.includes('<title>Playground - Untitled</title>')).toBe(true);
}

test('test_open_then_save_round_trips_through_the_temp_file', validateOpenThenSaveRoundTripsThroughTheTempFile);
test('test_open_returns_versions_without_id_keys', validateOpenReturnsVersionsWithoutIdKeys);
test('test_open_rejects_bad_versions', validateOpenRejectsBadVersions);
test('test_page_holds_the_unsaved_dialog_and_an_untitled_title', validatePageHoldsTheUnsavedDialogAndAnUntitledTitle);
