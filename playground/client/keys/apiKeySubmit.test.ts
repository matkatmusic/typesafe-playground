import { describe, test, expect, afterEach } from 'bun:test';
import { isKeyMissing, refreshSubmitAvailability } from './apiKey';
import { installFakeDom, removeFakeDom } from './apiKeyFakeDom';

function validateMissingKeyMessageNamesTheSubqProvider() {
    const elements = installFakeDom(false, false);
    elements.providerSwitch.checked = true;
    refreshSubmitAvailability();
    expect(elements.errorLine.textContent).toBe('Add a SubQ API key to submit runs');
}

function validateKeyIsMissingOnlyWithNoEnvKeyAndNothingTyped() {
    expect(isKeyMissing(false, '  ')).toBe(true);
    expect(isKeyMissing(false, 'k')).toBe(false);
    expect(isKeyMissing(true, '')).toBe(false);
}

function validateNoKeyDisablesSubmitAndShowsTheMessageUntilAKeyIsTyped() {
    const elements = installFakeDom(false);
    refreshSubmitAvailability();
    expect(elements.submitButton.disabled).toBe(true);
    expect(elements.errorLine.textContent).toBe('Add a TypeSafe API key to submit runs');
    elements.typeSafeKeyEditor.value = 'typed';
    refreshSubmitAvailability();
    expect(elements.submitButton.disabled).toBe(false);
    expect(elements.errorLine.textContent).toBe('');
}

function validateEnvKeyKeepsSubmitEnabled() {
    const elements = installFakeDom(true);
    refreshSubmitAvailability();
    expect(elements.submitButton.disabled).toBe(false);
    expect(elements.errorLine.textContent).toBe('');
}

function validateSubqKeepsSubmitEnabledWithAnEmptyKeyField() {
    const elements = installFakeDom(false, true);
    elements.providerSwitch.checked = true;
    refreshSubmitAvailability();
    expect(elements.submitButton.disabled).toBe(false);
    expect(elements.errorLine.textContent).toBe('');
}

function validateTypeSafeStillNeedsAKeyWhenTheSubqEnvKeyExists() {
    const elements = installFakeDom(false, true);
    refreshSubmitAvailability();
    expect(elements.submitButton.disabled).toBe(true);
    expect(elements.errorLine.textContent).toBe('Add a TypeSafe API key to submit runs');
}

function registerSubmitTests() {
    afterEach(removeFakeDom);
    test('test_missing_key_message_names_the_subq_provider', validateMissingKeyMessageNamesTheSubqProvider);
    test('test_subq_keeps_submit_enabled_with_an_empty_key_field', validateSubqKeepsSubmitEnabledWithAnEmptyKeyField);
    test('test_typesafe_still_needs_a_key_when_the_subq_env_key_exists', validateTypeSafeStillNeedsAKeyWhenTheSubqEnvKeyExists);
    test('test_key_is_missing_only_with_no_env_key_and_nothing_typed', validateKeyIsMissingOnlyWithNoEnvKeyAndNothingTyped);
    test('test_no_key_disables_submit_and_shows_the_message_until_a_key_is_typed', validateNoKeyDisablesSubmitAndShowsTheMessageUntilAKeyIsTyped);
    test('test_env_key_keeps_submit_enabled', validateEnvKeyKeepsSubmitEnabled);
}

describe('apiKey submit availability', registerSubmitTests);
