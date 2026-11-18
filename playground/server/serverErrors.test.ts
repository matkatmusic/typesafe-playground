import { test, expect } from 'bun:test';
import { buildErrorResponse, hideKeysInMessage, setLastTypedKey } from './serverErrors';

function getEnvKey() {
    return 'env-secret-123';
}

function getTypedKey() {
    return 'typed-secret-456';
}

function validateEnvKeyAndTypedKeyAreHidden() {
    const envKey = getEnvKey();
    const typedKey = getTypedKey();
    Bun.env.TYPESAFE_API_KEY = envKey;
    setLastTypedKey(typedKey);
    const message = `bad key ${envKey} and ${typedKey} and ${envKey}`;
    expect(hideKeysInMessage(message)).toBe('bad key [key hidden] and [key hidden] and [key hidden]');
}

function validateEmptyKeysLeaveTheMessageAlone() {
    Bun.env.TYPESAFE_API_KEY = '';
    setLastTypedKey('');
    expect(hideKeysInMessage('plain message')).toBe('plain message');
}

async function validateErrorResponseIs500WithHiddenKeys() {
    Bun.env.TYPESAFE_API_KEY = getEnvKey();
    setLastTypedKey(getTypedKey());
    const response = buildErrorResponse(new Error(`failed with ${getTypedKey()}`));
    expect(response.status).toBe(500);
    expect(await response.text()).toBe('failed with [key hidden]');
}

test('test_env_key_and_typed_key_are_hidden_in_messages', validateEnvKeyAndTypedKeyAreHidden);
test('test_empty_keys_leave_the_message_alone', validateEmptyKeysLeaveTheMessageAlone);
test('test_error_response_is_500_with_hidden_keys', validateErrorResponseIs500WithHiddenKeys);
