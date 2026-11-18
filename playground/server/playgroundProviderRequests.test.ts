import { test, expect, afterEach, describe } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { executeRunRequest, getSubqMissingKeyMessage, getMissingKeyMessage, type CreateRunClient } from './playgroundRequests';
import { initHistory, loadHistory, type RunOutput } from '../history/playgroundHistory';
import { hideKeysInMessage, setLastTypedKey } from './serverErrors';
import { getHardCodedQuestions } from '../providers/typeSafeQuery';

interface Call { apiKey: string; provider: unknown }

interface SavedKeys { typeSafeKey: string | undefined; subqKey: string | undefined }

function getStubOutput(): RunOutput {
    return { answers: {}, usage: { input_tokens: 5, output_tokens: 1 } } as unknown as RunOutput;
}

function resetEnvKeys(savedKeys: SavedKeys) {
    Bun.env.TYPESAFE_API_KEY = savedKeys.typeSafeKey;
    Bun.env.SUBQ_AI_API_KEY = savedKeys.subqKey;
    setLastTypedKey('');
}

function collectProviders(outputs: { provider: string }[]): string[] {
    const providers: string[] = [];
    for (const output of outputs) {
        providers.push(output.provider);
    }
    return providers;
}

async function buildTempHistoryPath() {
    const historyPath = `${mkdtempSync(`${tmpdir()}/playground-provider-`)}/results/playground-history.json`;
    await initHistory(historyPath);
    return historyPath;
}

function createStubFactory(calls: Call[]): CreateRunClient {
    async function getStubSystemOne() {
        return getStubOutput();
    }
    function createStubClient(apiKey: string, provider?: unknown) {
        calls.push({ apiKey, provider });
        return { systemOne: getStubSystemOne };
    }
    return createStubClient as CreateRunClient;
}

function createRunRequest(body: object): Request {
    return new Request('http://127.0.0.1:4399/run', { method: 'POST', body: JSON.stringify({ index: 0, calls: 1, state: {}, questions: getHardCodedQuestions(), ...body }) });
}

async function validateSubqTypedKeyBeatsSubqEnvKey() {
    Bun.env.SUBQ_AI_API_KEY = 'subq-env';
    Bun.env.TYPESAFE_API_KEY = 'ts-env';
    const calls: Call[] = [];
    const response = await executeRunRequest(createRunRequest({ provider: 'SubQ', apiKey: ' subq-typed ' }), createStubFactory(calls), await buildTempHistoryPath());
    expect(response.status).toBe(200);
    expect(calls).toEqual([{ apiKey: 'subq-typed', provider: 'SubQ' }]);
}

async function validateSubqEnvKeyIsUsedWhenNothingIsTyped() {
    Bun.env.SUBQ_AI_API_KEY = 'subq-env';
    Bun.env.TYPESAFE_API_KEY = 'ts-env';
    const calls: Call[] = [];
    await executeRunRequest(createRunRequest({ provider: 'SubQ', apiKey: '' }), createStubFactory(calls), await buildTempHistoryPath());
    expect(calls).toEqual([{ apiKey: 'subq-env', provider: 'SubQ' }]);
}

async function validateSubqRunWithNoKeyReturnsTheSubqMissingKeyMessage() {
    Bun.env.SUBQ_AI_API_KEY = '';
    Bun.env.TYPESAFE_API_KEY = 'ts-env';
    const response = await executeRunRequest(createRunRequest({ provider: 'SubQ', apiKey: '' }), createStubFactory([]), await buildTempHistoryPath());
    expect(response.status).toBe(400);
    expect(await response.text()).toBe(getSubqMissingKeyMessage());
    expect(getSubqMissingKeyMessage()).toBe('Add a SubQ API key');
}

async function validateTypeSafeRunKeepsUsingTheTypeSafeEnvKey() {
    Bun.env.SUBQ_AI_API_KEY = 'subq-env';
    Bun.env.TYPESAFE_API_KEY = 'ts-env';
    const calls: Call[] = [];
    await executeRunRequest(createRunRequest({ provider: 'TypeSafe', apiKey: '' }), createStubFactory(calls), await buildTempHistoryPath());
    expect(calls).toEqual([{ apiKey: 'ts-env', provider: 'TypeSafe' }]);
}

async function validateMissingProviderMeansTypeSafe() {
    Bun.env.TYPESAFE_API_KEY = 'ts-env';
    const calls: Call[] = [];
    await executeRunRequest(createRunRequest({}), createStubFactory(calls), await buildTempHistoryPath());
    expect(calls).toEqual([{ apiKey: 'ts-env', provider: 'TypeSafe' }]);
}

async function validateUnknownProviderReturns400() {
    const response = await executeRunRequest(createRunRequest({ provider: 'Other' }), createStubFactory([]), await buildTempHistoryPath());
    expect(response.status).toBe(400);
    expect(await response.text()).toBe("provider must be 'TypeSafe' or 'SubQ'");
}

async function validateEachStoredOutputRecordsItsProvider() {
    Bun.env.SUBQ_AI_API_KEY = 'subq-env';
    const historyPath = await buildTempHistoryPath();
    const response = await executeRunRequest(createRunRequest({ provider: 'SubQ', calls: 2 }), createStubFactory([]), historyPath);
    const body = (await response.json()) as { outputs: { provider: string }[] };
    expect(collectProviders(body.outputs)).toEqual(['SubQ', 'SubQ']);
    const history = await loadHistory(historyPath);
    expect(collectProviders(history[0].outputs as unknown as { provider: string }[])).toEqual(['SubQ', 'SubQ']);
}

async function validateTypeSafeOutputsRecordTypeSafe() {
    Bun.env.TYPESAFE_API_KEY = 'ts-env';
    const response = await executeRunRequest(createRunRequest({ provider: 'TypeSafe' }), createStubFactory([]), await buildTempHistoryPath());
    const body = (await response.json()) as { outputs: { provider: string }[] };
    expect(body.outputs[0].provider).toBe('TypeSafe');
    expect(getMissingKeyMessage()).toBe('Add a TypeSafe API key');
}

function validateSubqEnvKeyIsHiddenInMessages() {
    Bun.env.SUBQ_AI_API_KEY = 'subq-secret-789';
    expect(hideKeysInMessage('bad key subq-secret-789')).toBe('bad key [key hidden]');
}

function registerEnvKeyReset() {
    const savedKeys: SavedKeys = { typeSafeKey: Bun.env.TYPESAFE_API_KEY, subqKey: Bun.env.SUBQ_AI_API_KEY };
    function resetSavedEnvKeys() {
        resetEnvKeys(savedKeys);
    }
    afterEach(resetSavedEnvKeys);
}

function registerProviderRequestTests() {
    registerEnvKeyReset();
    test('test_subq_typed_key_beats_subq_env_key', validateSubqTypedKeyBeatsSubqEnvKey);
    test('test_subq_env_key_is_used_when_nothing_is_typed', validateSubqEnvKeyIsUsedWhenNothingIsTyped);
    test('test_subq_run_with_no_key_returns_the_subq_missing_key_message', validateSubqRunWithNoKeyReturnsTheSubqMissingKeyMessage);
    test('test_typesafe_run_keeps_using_the_typesafe_env_key', validateTypeSafeRunKeepsUsingTheTypeSafeEnvKey);
    test('test_missing_provider_means_typesafe', validateMissingProviderMeansTypeSafe);
    test('test_unknown_provider_returns_400', validateUnknownProviderReturns400);
    test('test_each_stored_output_records_its_provider', validateEachStoredOutputRecordsItsProvider);
    test('test_typesafe_outputs_record_typesafe', validateTypeSafeOutputsRecordTypeSafe);
    test('test_subq_env_key_is_hidden_in_messages', validateSubqEnvKeyIsHiddenInMessages);
}

describe('playgroundProviderRequests', registerProviderRequestTests);
