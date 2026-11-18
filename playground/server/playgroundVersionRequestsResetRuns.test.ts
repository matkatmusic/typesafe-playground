import { test, expect } from 'bun:test';
import { dispatchRequest } from './playground';
import { executeRunRequest, type CreateRunClient } from './playgroundRequests';
import { executeSaveRequest } from './playgroundVersionRequests';
import { getHardCodedQuestions } from '../providers/typeSafeQuery';
import type { Version } from '../history/playgroundHistory';
import { getAllowedHost, getPort, buildTempHistoryPath, buildPostRequest } from './playgroundVersionRequestsSupport';

async function validateResetRunsClearsOutputsAndCallsOfOneVersionAndKeepsTheRest() {
    const historyPath = await buildTempHistoryPath();
    const buildRanVersion = (id: number) => ({ time: 't', state: { a: id }, questions: { q: id }, calls: 2, outputs: [{}, {}], note: 'kept' });
    await dispatchRequest(buildPostRequest('/open', { versions: [buildRanVersion(1), buildRanVersion(2)] }), getPort(), historyPath);
    const response = await dispatchRequest(buildPostRequest('/reset-runs', { index: 1 }), getPort(), historyPath);
    expect(response.status).toBe(200);
    const cleared = (await response.json()) as Version;
    expect(cleared).toEqual({ time: 't', state: { a: 2 }, questions: { q: 2 }, calls: 0, outputs: [], note: 'kept' } as unknown as Version);
    const saved = (await (await executeSaveRequest(historyPath)).json()) as { versions: Version[] };
    expect(saved.versions[1]).toEqual(cleared);
    expect(saved.versions[0]).toEqual(buildRanVersion(1) as unknown as Version);
}

async function validateResetRunsRejectsAnUnknownIndex() {
    const historyPath = await buildTempHistoryPath();
    const response = await dispatchRequest(buildPostRequest('/reset-runs', { index: 999999 }), getPort(), historyPath);
    expect(response.status).toBe(400);
    expect(await response.text()).toBe('index must be the integer index of an existing version');
}

async function executeStubbedRunOfIndexZero(historyPath: string) {
    const stubClient = { systemOne: async () => ({ answers: {}, usage: { input_tokens: 5, output_tokens: 1 } }) };
    const createClient = (() => stubClient) as unknown as CreateRunClient;
    const body = JSON.stringify({ index: 0, calls: 1, state: { typed: 'new' }, questions: {} });
    await executeRunRequest(new Request(`http://${getAllowedHost()}/run`, { method: 'POST', body }), createClient, historyPath);
}

async function validateSubmitAfterResettingTheOnlyVersionFillsItInPlace() {
    Bun.env.TYPESAFE_API_KEY = 'env-key';
    const historyPath = await buildTempHistoryPath();
    const oldRun = { answers: {}, usage: { input_tokens: 1, output_tokens: 1 } };
    const ranVersion = { time: 't', state: { a: 1 }, questions: getHardCodedQuestions(), calls: 1, outputs: [oldRun], note: 'old note' };
    await dispatchRequest(buildPostRequest('/open', { versions: [ranVersion] }), getPort(), historyPath);
    await dispatchRequest(buildPostRequest('/reset-runs', { index: 0 }), getPort(), historyPath);
    await executeStubbedRunOfIndexZero(historyPath);
    const saved = (await (await executeSaveRequest(historyPath)).json()) as { versions: Version[] };
    expect(saved.versions.length).toBe(1);
    expect(saved.versions[0].calls).toBe(1);
    expect(saved.versions[0].outputs.length).toBe(1);
    expect(saved.versions[0].state).toEqual({ typed: 'new' });
}

test('test_reset_runs_clears_outputs_and_calls_of_one_version_and_keeps_the_rest', validateResetRunsClearsOutputsAndCallsOfOneVersionAndKeepsTheRest);
test('test_reset_runs_rejects_an_unknown_index', validateResetRunsRejectsAnUnknownIndex);
test('test_submit_after_resetting_the_only_version_fills_it_in_place', validateSubmitAfterResettingTheOnlyVersionFillsItInPlace);
