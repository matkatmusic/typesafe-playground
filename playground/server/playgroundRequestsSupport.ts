import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import type { CreateRunClient } from './playgroundRequests';
import { initHistory, type RunOutput } from '../history/playgroundHistory';
import { getHardCodedQuestions } from '../providers/typeSafeQuery';

export interface Call { apiKey: string; request: unknown }

export function getStubOutput(): RunOutput {
    return { answers: {}, usage: { input_tokens: 5, output_tokens: 1 } } as unknown as RunOutput;
}

export async function buildTempHistoryPath() {
    const historyPath = `${mkdtempSync(`${tmpdir()}/playground-run-`)}/results/playground-history.json`;
    await initHistory(historyPath);
    return historyPath;
}

export function createStubFactory(calls: Call[]): CreateRunClient {
    function createStubClient(apiKey: string) {
        async function createStubSystemOneOutput(request: unknown) {
            calls.push({ apiKey, request });
            return getStubOutput();
        }
        return { systemOne: createStubSystemOneOutput };
    }
    return createStubClient;
}

export function createRunRequest(body: unknown): Request {
    return new Request('http://127.0.0.1:4399/run', { method: 'POST', body: JSON.stringify({ index: 0, state: {}, questions: getHardCodedQuestions(), ...(body as object) }) });
}
