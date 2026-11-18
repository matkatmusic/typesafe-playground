import { test, expect } from 'bun:test';
import { TypeSafeClient } from '@typesafe-ai/sdk';
import {
    createClientForProvider,
    createTypeSafeClient,
    getMaxCalls,
    getMinCalls,
    getMissingKeyMessage,
    getSubqMissingKeyMessage,
    isCallsInRange,
    selectApiKey,
} from './playgroundRequestsClient';

function validateMissingKeyMessagesNameEachProvider() {
    // The TypeSafe message asks for a TypeSafe key.
    expect(getMissingKeyMessage()).toBe('Add a TypeSafe API key');
    // The SubQ message asks for a SubQ key.
    expect(getSubqMissingKeyMessage()).toBe('Add a SubQ API key');
}

function validateCallLimitsAreOneAndTen() {
    expect(getMinCalls()).toBe(1);
    expect(getMaxCalls()).toBe(10);
}

function validateCreateTypeSafeClientReturnsTypeSafeClient() {
    // The client is built from the key and has a systemOne method.
    const client = createTypeSafeClient('typed-key');
    expect(client instanceof TypeSafeClient).toBe(true);
    expect(typeof client.systemOne).toBe('function');
}

function validateTypeSafeProviderGetsTypeSafeClient() {
    const client = createClientForProvider('typed-key', 'TypeSafe');
    expect(client instanceof TypeSafeClient).toBe(true);
}

function validateSubqProviderGetsNonTypeSafeClient() {
    // The SubQ client is a plain object with a systemOne method.
    const client = createClientForProvider('typed-key', 'SubQ');
    expect(client instanceof TypeSafeClient).toBe(false);
    expect(typeof client.systemOne).toBe('function');
}

function validateSelectApiKeyPrefersTypedKey() {
    expect(selectApiKey('typed', 'env')).toBe('typed');
}

function validateSelectApiKeyFallsBackToEnvironmentKey() {
    expect(selectApiKey('', 'env')).toBe('env');
}

function validateCallsInRangeAcceptsOneToTen() {
    expect(isCallsInRange(1)).toBe(true);
    expect(isCallsInRange(5)).toBe(true);
    expect(isCallsInRange(10)).toBe(true);
}

function validateCallsInRangeRejectsOutsideOneToTen() {
    expect(isCallsInRange(0)).toBe(false);
    expect(isCallsInRange(11)).toBe(false);
    expect(isCallsInRange(-3)).toBe(false);
}

function validateCallsInRangeRejectsNonIntegersAndNonNumbers() {
    expect(isCallsInRange(2.5)).toBe(false);
    expect(isCallsInRange('3')).toBe(false);
    expect(isCallsInRange(undefined)).toBe(false);
    expect(isCallsInRange(null)).toBe(false);
}

test('test_missing_key_messages_name_each_provider', validateMissingKeyMessagesNameEachProvider);
test('test_call_limits_are_one_and_ten', validateCallLimitsAreOneAndTen);
test('test_create_typesafe_client_returns_typesafe_client', validateCreateTypeSafeClientReturnsTypeSafeClient);
test('test_typesafe_provider_gets_typesafe_client', validateTypeSafeProviderGetsTypeSafeClient);
test('test_subq_provider_gets_non_typesafe_client', validateSubqProviderGetsNonTypeSafeClient);
test('test_select_api_key_prefers_typed_key', validateSelectApiKeyPrefersTypedKey);
test('test_select_api_key_falls_back_to_environment_key', validateSelectApiKeyFallsBackToEnvironmentKey);
test('test_calls_in_range_accepts_one_to_ten', validateCallsInRangeAcceptsOneToTen);
test('test_calls_in_range_rejects_outside_one_to_ten', validateCallsInRangeRejectsOutsideOneToTen);
test('test_calls_in_range_rejects_non_integers_and_non_numbers', validateCallsInRangeRejectsNonIntegersAndNonNumbers);
