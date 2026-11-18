import { test, expect } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dispatchRequest } from './playground';
import { initHistory, loadHistory, type RunOutput } from '../history/playgroundHistory';
import type { RunResult } from '../client/page/types';
import { getHardCodedQuestions, getHardCodedState } from '../providers/typeSafeQuery';

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

function assertClientNotCreated(): never {
    throw new Error('client must not be created');
}

function buildRunRequest(body: object) {
    const host = getAllowedHost();
    const headers = { host, origin: `http://${host}`, 'content-type': 'application/json' };
    return new Request(`http://${host}/run`, { method: 'POST', headers, body: JSON.stringify(body) });
}

function getStubOutput() {
    return { answers: { requestsAction: { noul: 0.9 } }, usage: { input_tokens: 5, output_tokens: 1 } } as unknown as RunOutput;
}

function createStubClient() {
    async function getStubSystemOne() {
        return getStubOutput();
    }
    return { systemOne: getStubSystemOne };
}

async function validateRunPostWithoutKeyIsRejected(historyPath: string) {
    Bun.env.TYPESAFE_API_KEY = '';
    const noKeyRequest = buildRunRequest({ index: 0, calls: 1, state: {}, questions: getHardCodedQuestions() });
    const noKeyResponse = await dispatchRequest(noKeyRequest, getPort(), historyPath, assertClientNotCreated);
    expect(noKeyResponse.status).toBe(400);
}

async function validateRunPostWithKeyUsesTheStubClient(historyPath: string) {
    const keyRequest = buildRunRequest({ index: 0, calls: 2, apiKey: 'typed', state: getHardCodedState(), questions: getHardCodedQuestions() });
    const keyResponse = await dispatchRequest(keyRequest, getPort(), historyPath, createStubClient);
    expect(keyResponse.status).toBe(200);
    const result = (await keyResponse.json()) as RunResult;
    const output = getStubOutput();
    expect(result.outputs).toEqual([{ ...output, provider: 'TypeSafe' }, { ...output, provider: 'TypeSafe' }]);
    expect(result.version.calls).toBe(2);
}

async function validateRunPostUsesTheStubClientAndWritesTheTempFile() {
    const historyPath = await buildTempHistoryPath();
    await validateRunPostWithoutKeyIsRejected(historyPath);
    await validateRunPostWithKeyUsesTheStubClient(historyPath);
    expect((await loadHistory(historyPath))[0].outputs.length).toBe(2);
}

test('test_run_post_uses_the_stub_client_and_writes_the_temp_file', validateRunPostUsesTheStubClientAndWritesTheTempFile);
