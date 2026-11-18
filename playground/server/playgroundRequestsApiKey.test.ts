import { test, expect } from 'bun:test';
import { executeRunRequest, getMissingKeyMessage, selectApiKey } from './playgroundRequests';
import { hideKeysInMessage } from './serverErrors';
import { buildTempHistoryPath, createRunRequest, createStubFactory, type Call } from './playgroundRequestsSupport';

function validateTypedKeyBeatsEnvKey() {
    expect(selectApiKey('typed', 'env')).toBe('typed');
    expect(selectApiKey('', 'env')).toBe('env');
    expect(selectApiKey('', '')).toBe('');
}

async function validateTypedKeyIsUsedOverEnvKey() {
    Bun.env.TYPESAFE_API_KEY = 'env-key';
    const calls: Call[] = [];
    const response = await executeRunRequest(createRunRequest({ calls: 1, apiKey: '  typed-key ' }), createStubFactory(calls), await buildTempHistoryPath());
    expect(response.status).toBe(200);
    expect(calls.length).toBe(1);
    expect(calls[0].apiKey).toBe('typed-key');
}

async function validateEnvKeyIsUsedWhenNothingIsTyped() {
    Bun.env.TYPESAFE_API_KEY = 'env-key';
    const calls: Call[] = [];
    const historyPath = await buildTempHistoryPath();
    await executeRunRequest(createRunRequest({ calls: 1, apiKey: '' }), createStubFactory(calls), historyPath);
    expect(calls[0].apiKey).toBe('env-key');
    await executeRunRequest(createRunRequest({ calls: 1 }), createStubFactory(calls), historyPath);
    expect(calls[1].apiKey).toBe('env-key');
}

async function validateNoKeyReturns400WithoutCallingTheClient() {
    Bun.env.TYPESAFE_API_KEY = '';
    const calls: Call[] = [];
    const response = await executeRunRequest(createRunRequest({ calls: 1, apiKey: '   ' }), createStubFactory(calls), await buildTempHistoryPath());
    expect(response.status).toBe(400);
    expect(await response.text()).toBe(getMissingKeyMessage());
    expect(getMissingKeyMessage()).toBe('Add a TypeSafe API key');
    expect(calls.length).toBe(0);
}

async function validateTypedKeyIsHiddenInLaterErrorMessages() {
    Bun.env.TYPESAFE_API_KEY = '';
    await executeRunRequest(createRunRequest({ calls: 1, apiKey: 'typed-secret-789' }), createStubFactory([]), await buildTempHistoryPath());
    expect(hideKeysInMessage('failed with typed-secret-789')).toBe('failed with [key hidden]');
}

test('test_typed_key_beats_env_key', validateTypedKeyBeatsEnvKey);
test('test_run_uses_typed_key_over_env_key', validateTypedKeyIsUsedOverEnvKey);
test('test_run_uses_env_key_when_nothing_is_typed', validateEnvKeyIsUsedWhenNothingIsTyped);
test('test_run_with_no_key_returns_400_and_makes_no_call', validateNoKeyReturns400WithoutCallingTheClient);
test('test_run_remembers_typed_key_for_error_scrubbing', validateTypedKeyIsHiddenInLaterErrorMessages);
