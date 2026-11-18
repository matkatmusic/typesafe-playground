import { test, expect } from 'bun:test';
import { dispatchRequest } from './playground';
import { loadHistory } from '../history/playgroundHistory';
import { executeRunRequest, type CreateRunClient } from './playgroundRequests';
import { executeNewRequest, executeSaveRequest } from './playgroundVersionRequests';
import { getHardCodedQuestions, getHardCodedState } from '../providers/typeSafeQuery';
import type { Version } from '../history/playgroundHistory';
import { getAllowedHost, getPort, getOpenedVersion, buildTempHistoryPath, buildPostRequest } from './playgroundVersionRequestsSupport';

async function validateNewWritesABlankDocument() {
    const historyPath = await buildTempHistoryPath();
    await dispatchRequest(buildPostRequest('/open', { versions: [getOpenedVersion()] }), getPort(), historyPath);
    const newResponse = await dispatchRequest(buildPostRequest('/new', {}), getPort(), historyPath);
    const created = (await newResponse.json()) as { versions: Version[] };
    expect(created.versions.length).toBe(1);
    expect(created.versions[0].state).toEqual(getHardCodedState());
    expect(created.versions[0].questions).toEqual(getHardCodedQuestions());
    expect(created.versions[0].calls).toBe(0);
    expect(created.versions[0].outputs).toEqual([]);
}

async function validateNewWritesAHistoryFileWithoutIdKeys() {
    const historyPath = await buildTempHistoryPath();
    await dispatchRequest(buildPostRequest('/new', {}), getPort(), historyPath);
    const written = (await Bun.file(historyPath).json()) as object[];
    expect(written.length).toBe(1);
    expect('id' in written[0]).toBe(false);
}

async function validateLoadHistoryStripsOldIdKeys() {
    const historyPath = await buildTempHistoryPath();
    await Bun.write(historyPath, JSON.stringify([{ ...getOpenedVersion(), id: 3 }, { ...getOpenedVersion(), id: 4 }]));
    const history = await loadHistory(historyPath);
    expect(history.length).toBe(2);
    expect('id' in history[0]).toBe(false);
    expect('id' in history[1]).toBe(false);
}

async function validateFirstSubmitAfterNewMakesVersionOneOfOne() {
    Bun.env.TYPESAFE_API_KEY = 'env-key';
    const historyPath = await buildTempHistoryPath();
    await executeNewRequest(historyPath);
    const stubClient = { systemOne: async () => ({ answers: {}, usage: { input_tokens: 5, output_tokens: 1 } }) };
    const createClient = (() => stubClient) as unknown as CreateRunClient;
    const body = JSON.stringify({ index: 0, calls: 1, state: { typed: 'changed' }, questions: getHardCodedQuestions() });
    const response = await executeRunRequest(new Request(`http://${getAllowedHost()}/run`, { method: 'POST', body }), createClient, historyPath);
    const result = (await response.json()) as { version: Version; index: number };
    expect(result.index).toBe(0);
    const saved = (await (await executeSaveRequest(historyPath)).json()) as { versions: Version[] };
    expect(saved.versions.length).toBe(1);
    expect(saved.versions[0].state).toEqual({ typed: 'changed' });
    expect(saved.versions[0].outputs.length).toBe(1);
}

test('test_new_writes_a_blank_document', validateNewWritesABlankDocument);
test('test_new_writes_a_history_file_without_id_keys', validateNewWritesAHistoryFileWithoutIdKeys);
test('test_load_history_strips_old_id_keys', validateLoadHistoryStripsOldIdKeys);
test('test_first_submit_after_new_makes_version_one_of_one', validateFirstSubmitAfterNewMakesVersionOneOfOne);
