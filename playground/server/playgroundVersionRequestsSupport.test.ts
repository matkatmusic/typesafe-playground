import { test, expect } from 'bun:test';
import { loadHistory } from '../history/playgroundHistory';
import { getAllowedHost, getPort, getOpenedVersion, buildTempHistoryPath, buildPostRequest } from './playgroundVersionRequestsSupport';

function validateAllowedHostUsesThePort() {
    expect(getAllowedHost()).toBe(`127.0.0.1:${getPort()}`);
}

function validateOpenedVersionHasAllVersionFields() {
    const version = getOpenedVersion();
    expect(version.time).toBe('now');
    expect(version.state).toEqual({ a: 1 });
    expect(version.questions).toEqual({});
    expect(version.calls).toBe(2);
    expect(version.outputs).toEqual([]);
}

async function validateTempHistoryPathHoldsAnInitializedHistory() {
    const historyPath = await buildTempHistoryPath();
    expect(historyPath.endsWith('/results/playground-history.json')).toBe(true);
    expect(await Bun.file(historyPath).exists()).toBe(true);
    const versions = await loadHistory(historyPath);
    expect(versions.length).toBe(1);
}

async function validateTempHistoryPathsAreUnique() {
    const firstPath = await buildTempHistoryPath();
    const secondPath = await buildTempHistoryPath();
    expect(firstPath).not.toBe(secondPath);
}

async function validatePostRequestCarriesMethodUrlHeadersAndBody() {
    const request = buildPostRequest('/open', { versions: [] });
    const allowedHost = getAllowedHost();
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`http://${allowedHost}/open`);
    expect(request.headers.get('host')).toBe(allowedHost);
    expect(request.headers.get('origin')).toBe(`http://${allowedHost}`);
    expect(request.headers.get('content-type')).toBe('application/json');
    expect(await request.json()).toEqual({ versions: [] });
}

test('test_allowed_host_uses_the_port', validateAllowedHostUsesThePort);
test('test_opened_version_has_all_version_fields', validateOpenedVersionHasAllVersionFields);
test('test_temp_history_path_holds_an_initialized_history', validateTempHistoryPathHoldsAnInitializedHistory);
test('test_temp_history_paths_are_unique', validateTempHistoryPathsAreUnique);
test('test_post_request_carries_method_url_headers_and_body', validatePostRequestCarriesMethodUrlHeadersAndBody);
