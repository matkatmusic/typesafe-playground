import { expect } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import type { JsonValue, Questions } from '@typesafe-ai/sdk';
import { buildBatchVersions } from '../client/batch/batchPlan';
import { dispatchRequest } from './playground';
import { initHistory, loadHistory, type RunOutput } from '../history/playgroundHistory';

export function getPort() {
    return 4323;
}

function getAllowedHost() {
    return `127.0.0.1:${getPort()}`;
}

function getHeaders() {
    return { host: getAllowedHost(), origin: `http://${getAllowedHost()}`, 'content-type': 'application/json' };
}

export async function buildTempHistoryPath() {
    const historyPath = `${mkdtempSync(`${tmpdir()}/playground-batch-test-`)}/results/playground-history.json`;
    await initHistory(historyPath);
    return historyPath;
}

export function buildPost(path: string, body: unknown) {
    return new Request(`http://${getAllowedHost()}${path}`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) });
}

export function buildCountingClientFactory(failOnCall: number | null) {
    const seenStates: unknown[] = [];
    const output = { answers: {}, usage: { input_tokens: 7, output_tokens: 1 } } as unknown as RunOutput;
    async function executeSystemOne(request: { state: unknown }) {
        seenStates.push(request.state);
        if (seenStates.length === failOnCall)
            throw new Error('call failed');
        return output;
    }
    return { seenStates, createClient: () => ({ systemOne: executeSystemOne }) };
}

export async function openBatchAndRunEachItem(historyPath: string, shownIndex: number, states: Record<string, JsonValue>[], questions: Questions, createClient: () => { systemOne: (request: never) => Promise<RunOutput> }) {
    const history = await loadHistory(historyPath);
    const plan = buildBatchVersions(history, shownIndex, states, questions);
    const openResponse = await dispatchRequest(buildPost('/open', { versions: plan.versions }), getPort(), historyPath, createClient as never);
    expect(openResponse.status).toBe(200);
    const responses: Response[] = [];
    for (let i = 0; i < states.length; i++) {
        const body = { index: plan.itemIndexes[i], calls: 3, apiKey: 'typed', state: states[i], questions };
        responses.push(await dispatchRequest(buildPost('/run', body), getPort(), historyPath, createClient as never));
    }
    return { plan, responses };
}
