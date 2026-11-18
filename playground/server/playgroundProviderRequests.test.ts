import { test, expect, afterEach } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { executeRunRequest, SUBQ_MISSING_KEY_MESSAGE, MISSING_KEY_MESSAGE, type CreateRunClient } from './playgroundRequests';
import { initHistory, loadHistory, type RunOutput } from '../history/playgroundHistory';
import { hideKeysInMessage, setLastTypedKey } from './serverErrors';
import { HARD_CODED_QUESTIONS } from '../providers/typeSafeQuery';

type Call = { apiKey: string; provider: unknown };

const OUTPUT = { answers: {}, usage: { input_tokens: 5, output_tokens: 1 } } as unknown as RunOutput;
const savedTypeSafeKey = Bun.env.TYPESAFE_API_KEY;
const savedSubqKey = Bun.env.SUBQ_AI_API_KEY;

afterEach(() => {
  Bun.env.TYPESAFE_API_KEY = savedTypeSafeKey;
  Bun.env.SUBQ_AI_API_KEY = savedSubqKey;
  setLastTypedKey('');
});

async function buildTempHistoryPath() {
  const historyPath = `${mkdtempSync(`${tmpdir()}/playground-provider-`)}/results/playground-history.json`;
  await initHistory(historyPath);
  return historyPath;
}

function makeStubFactory(calls: Call[]): CreateRunClient {
  function createStubClient(apiKey: string, provider?: unknown) {
    calls.push({ apiKey, provider });
    return { systemOne: async () => OUTPUT };
  }
  return createStubClient as CreateRunClient;
}

function makeRunRequest(body: object): Request {
  return new Request('http://127.0.0.1:4399/run', { method: 'POST', body: JSON.stringify({ index: 0, calls: 1, state: {}, questions: HARD_CODED_QUESTIONS, ...body }) });
}

async function validateSubqTypedKeyBeatsSubqEnvKey() {
  Bun.env.SUBQ_AI_API_KEY = 'subq-env';
  Bun.env.TYPESAFE_API_KEY = 'ts-env';
  const calls: Call[] = [];
  const response = await executeRunRequest(makeRunRequest({ provider: 'SubQ', apiKey: ' subq-typed ' }), makeStubFactory(calls), await buildTempHistoryPath());
  expect(response.status).toBe(200);
  expect(calls).toEqual([{ apiKey: 'subq-typed', provider: 'SubQ' }]);
}

async function validateSubqEnvKeyIsUsedWhenNothingIsTyped() {
  Bun.env.SUBQ_AI_API_KEY = 'subq-env';
  Bun.env.TYPESAFE_API_KEY = 'ts-env';
  const calls: Call[] = [];
  await executeRunRequest(makeRunRequest({ provider: 'SubQ', apiKey: '' }), makeStubFactory(calls), await buildTempHistoryPath());
  expect(calls).toEqual([{ apiKey: 'subq-env', provider: 'SubQ' }]);
}

async function validateSubqRunWithNoKeyReturnsTheSubqMissingKeyMessage() {
  Bun.env.SUBQ_AI_API_KEY = '';
  Bun.env.TYPESAFE_API_KEY = 'ts-env';
  const response = await executeRunRequest(makeRunRequest({ provider: 'SubQ', apiKey: '' }), makeStubFactory([]), await buildTempHistoryPath());
  expect(response.status).toBe(400);
  expect(await response.text()).toBe(SUBQ_MISSING_KEY_MESSAGE);
  expect(SUBQ_MISSING_KEY_MESSAGE).toBe('Add a SubQ API key');
}

async function validateTypeSafeRunKeepsUsingTheTypeSafeEnvKey() {
  Bun.env.SUBQ_AI_API_KEY = 'subq-env';
  Bun.env.TYPESAFE_API_KEY = 'ts-env';
  const calls: Call[] = [];
  await executeRunRequest(makeRunRequest({ provider: 'TypeSafe', apiKey: '' }), makeStubFactory(calls), await buildTempHistoryPath());
  expect(calls).toEqual([{ apiKey: 'ts-env', provider: 'TypeSafe' }]);
}

async function validateMissingProviderMeansTypeSafe() {
  Bun.env.TYPESAFE_API_KEY = 'ts-env';
  const calls: Call[] = [];
  await executeRunRequest(makeRunRequest({}), makeStubFactory(calls), await buildTempHistoryPath());
  expect(calls).toEqual([{ apiKey: 'ts-env', provider: 'TypeSafe' }]);
}

async function validateUnknownProviderReturns400() {
  const response = await executeRunRequest(makeRunRequest({ provider: 'Other' }), makeStubFactory([]), await buildTempHistoryPath());
  expect(response.status).toBe(400);
  expect(await response.text()).toBe("provider must be 'TypeSafe' or 'SubQ'");
}

async function validateEachStoredOutputRecordsItsProvider() {
  Bun.env.SUBQ_AI_API_KEY = 'subq-env';
  const historyPath = await buildTempHistoryPath();
  const response = await executeRunRequest(makeRunRequest({ provider: 'SubQ', calls: 2 }), makeStubFactory([]), historyPath);
  const body = (await response.json()) as { outputs: { provider: string }[] };
  expect(body.outputs.map((output) => output.provider)).toEqual(['SubQ', 'SubQ']);
  const history = await loadHistory(historyPath);
  expect(history[0].outputs.map((output) => (output as unknown as { provider: string }).provider)).toEqual(['SubQ', 'SubQ']);
}

async function validateTypeSafeOutputsRecordTypeSafe() {
  Bun.env.TYPESAFE_API_KEY = 'ts-env';
  const response = await executeRunRequest(makeRunRequest({ provider: 'TypeSafe' }), makeStubFactory([]), await buildTempHistoryPath());
  const body = (await response.json()) as { outputs: { provider: string }[] };
  expect(body.outputs[0].provider).toBe('TypeSafe');
  expect(MISSING_KEY_MESSAGE).toBe('Add a TypeSafe API key');
}

function validateSubqEnvKeyIsHiddenInMessages() {
  Bun.env.SUBQ_AI_API_KEY = 'subq-secret-789';
  expect(hideKeysInMessage('bad key subq-secret-789')).toBe('bad key [key hidden]');
}

test('test_subq_typed_key_beats_subq_env_key', validateSubqTypedKeyBeatsSubqEnvKey);
test('test_subq_env_key_is_used_when_nothing_is_typed', validateSubqEnvKeyIsUsedWhenNothingIsTyped);
test('test_subq_run_with_no_key_returns_the_subq_missing_key_message', validateSubqRunWithNoKeyReturnsTheSubqMissingKeyMessage);
test('test_typesafe_run_keeps_using_the_typesafe_env_key', validateTypeSafeRunKeepsUsingTheTypeSafeEnvKey);
test('test_missing_provider_means_typesafe', validateMissingProviderMeansTypeSafe);
test('test_unknown_provider_returns_400', validateUnknownProviderReturns400);
test('test_each_stored_output_records_its_provider', validateEachStoredOutputRecordsItsProvider);
test('test_typesafe_outputs_record_typesafe', validateTypeSafeOutputsRecordTypeSafe);
test('test_subq_env_key_is_hidden_in_messages', validateSubqEnvKeyIsHiddenInMessages);
