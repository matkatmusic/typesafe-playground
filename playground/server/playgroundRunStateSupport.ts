import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import type { CreateRunClient } from './playgroundRequests';
import { initHistory, writeHistory, type RunOutput, type Version } from '../history/playgroundHistory';
import { getHardCodedQuestions } from '../providers/typeSafeQuery';

export function getStubRunOutput() {
    return { answers: {}, usage: { input_tokens: 5, output_tokens: 1 } } as unknown as RunOutput;
}

export async function buildTempHistoryPath() {
    const historyPath = `${mkdtempSync(`${tmpdir()}/playground-run-state-`)}/results/playground-history.json`;
    await initHistory(historyPath);
    return historyPath;
}

export function createStubFactory(seenKeys: string[]): CreateRunClient {
    function createStubClient(apiKey: string) {
        async function executeStubSystemOne() {
            seenKeys.push(apiKey);
            return getStubRunOutput();
        }
        return { systemOne: executeStubSystemOne };
    }
    return createStubClient;
}

export function createRunRequest(state: unknown, index = 0, questions: unknown = getHardCodedQuestions()): Request {
    return new Request('http://127.0.0.1:4399/run', { method: 'POST', body: JSON.stringify({ index: index, calls: 1, state: state, questions: questions }) });
}

export async function buildFourVersionHistoryPath() {
    const historyPath = await buildTempHistoryPath();
    const versions: Version[] = [];
    for (let number = 1; number <= 4; number++)
        versions.push({ time: `t${number}`, state: { v: number }, questions: getHardCodedQuestions(), calls: 1, outputs: [getStubRunOutput()] });
    await writeHistory(historyPath, versions);
    return historyPath;
}
