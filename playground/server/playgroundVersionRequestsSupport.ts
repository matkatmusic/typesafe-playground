import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { initHistory } from '../history/playgroundHistory';

export function getPort() {
    return 4318;
}

export function getAllowedHost() {
    return `127.0.0.1:${getPort()}`;
}

export function getOpenedVersion() {
    return { time: 'now', state: { a: 1 }, questions: {}, calls: 2, outputs: [] };
}

export async function buildTempHistoryPath() {
    const historyPath = `${mkdtempSync(`${tmpdir()}/playground-version-requests-test-`)}/results/playground-history.json`;
    await initHistory(historyPath);
    return historyPath;
}

export function buildPostRequest(path: string, body: unknown) {
    const allowedHost = getAllowedHost();
    const headers = { host: allowedHost, origin: `http://${allowedHost}`, 'content-type': 'application/json' };
    return new Request(`http://${allowedHost}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
}
