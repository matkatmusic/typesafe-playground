import { test, expect, afterEach, describe } from 'bun:test';
import { clearTypedKey, computeShowButtonHidden, hideTypedKey, readProvider, refreshProviderSwitch, refreshSubmitAvailability, setKeyPlaceholder, setTypedKeyToVisible, updateShowKeyButton } from './apiKey';
import { installFakeDom, removeFakeDom } from './apiKeyFakeDom';

function validateTurningTheSwitchClearsTheTypedKeyAndHidesTheShowButton() {
    const elements = installFakeDom(false, true);
    elements.typeSafeKeyEditor.value = 'typed';
    elements.showKeyButton.hidden = false;
    elements.providerSwitch.checked = true;
    clearTypedKey();
    expect(elements.typeSafeKeyEditor.value).toBe('');
    expect(elements.showKeyButton.hidden).toBe(true);
    refreshSubmitAvailability();
    expect(elements.submitButton.disabled).toBe(false);
}

function validateShowButtonIsHiddenOnlyWhenTheKeyIsEmpty() {
    expect(computeShowButtonHidden('')).toBe(true);
    expect(computeShowButtonHidden('a')).toBe(false);
}

function executeSetKeyPlaceholderWithTypeSafe() {
    setKeyPlaceholder(true, 'TypeSafe');
}

function validateDomFunctionsThrowWithoutADocument() {
    expect(updateShowKeyButton).toThrow();
    expect(executeSetKeyPlaceholderWithTypeSafe).toThrow();
    expect(hideTypedKey).toThrow();
    expect(setTypedKeyToVisible).toThrow();
    expect(refreshSubmitAvailability).toThrow();
}

function validateProviderIsTypeSafeWhenOffAndSubqWhenOn() {
    const elements = installFakeDom(false);
    expect(readProvider()).toBe('TypeSafe');
    elements.providerSwitch.checked = true;
    expect(readProvider()).toBe('SubQ');
}

function validateSwitchIsEnabledOnlyWhenTheSubqEnvKeyExists() {
    const withoutKey = installFakeDom(false, false);
    refreshProviderSwitch();
    expect(withoutKey.providerSwitch.disabled).toBe(true);
    const withKey = installFakeDom(false, true);
    refreshProviderSwitch();
    expect(withKey.providerSwitch.disabled).toBe(false);
}

function registerProviderSwitchTests() {
    afterEach(removeFakeDom);
    test('test_turning_the_switch_clears_the_typed_key_and_hides_the_show_button', validateTurningTheSwitchClearsTheTypedKeyAndHidesTheShowButton);
    test('test_provider_is_typesafe_when_off_and_subq_when_on', validateProviderIsTypeSafeWhenOffAndSubqWhenOn);
    test('test_switch_is_enabled_only_when_the_subq_env_key_exists', validateSwitchIsEnabledOnlyWhenTheSubqEnvKeyExists);
    test('test_show_button_is_hidden_only_when_the_key_is_empty', validateShowButtonIsHiddenOnlyWhenTheKeyIsEmpty);
    test('test_key_dom_functions_throw_without_a_document', validateDomFunctionsThrowWithoutADocument);
}

describe('api key provider switch', registerProviderSwitchTests);
