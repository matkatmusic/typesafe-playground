import { test, expect, afterEach, describe } from 'bun:test';
import { computeKeyPlaceholder, computeSubmitKeyMessage, refreshKeyTexts } from './apiKey';
import { FakeInput, installFakeDom, removeFakeDom } from './apiKeyFakeDom';

function validatePlaceholderNamesTheEnvKeyOnlyWhenOneExists() {
    expect(computeKeyPlaceholder(true, 'TypeSafe')).toBe('Using key from .env');
    expect(computeKeyPlaceholder(false, 'TypeSafe')).toBe('TypeSafe API key');
    expect(computeKeyPlaceholder(false, 'SubQ')).toBe('SubQ API key');
}

function validateSubmitKeyMessageNamesTheProvider() {
    expect(computeSubmitKeyMessage('TypeSafe')).toBe('Add a TypeSafe API key to submit runs');
    expect(computeSubmitKeyMessage('SubQ')).toBe('Add a SubQ API key to submit runs');
}

function validateKeyTextsFollowTheSwitch() {
    const elements = installFakeDom(false, false);
    refreshKeyTexts();
    expect(elements.typeSafeKeyLabel.textContent).toBe('TypeSafe API key');
    expect((elements.typeSafeKeyEditor as FakeInput & { placeholder: string }).placeholder).toBe('TypeSafe API key');
    elements.providerSwitch.checked = true;
    refreshKeyTexts();
    expect(elements.typeSafeKeyLabel.textContent).toBe('SubQ API key');
    expect((elements.typeSafeKeyEditor as FakeInput & { placeholder: string }).placeholder).toBe('SubQ API key');
}

function validateSubqEnvKeyPlaceholderStillNamesTheEnvKey() {
    const elements = installFakeDom(false, true);
    elements.providerSwitch.checked = true;
    refreshKeyTexts();
    expect(elements.typeSafeKeyLabel.textContent).toBe('SubQ API key');
    expect((elements.typeSafeKeyEditor as FakeInput & { placeholder: string }).placeholder).toBe('Using key from .env');
}

function registerKeyTextsTests() {
    afterEach(removeFakeDom);
    test('test_submit_key_message_names_the_provider', validateSubmitKeyMessageNamesTheProvider);
    test('test_key_texts_follow_the_switch', validateKeyTextsFollowTheSwitch);
    test('test_subq_env_key_placeholder_still_names_the_env_key', validateSubqEnvKeyPlaceholderStillNamesTheEnvKey);
    test('test_placeholder_names_the_env_key_only_when_one_exists', validatePlaceholderNamesTheEnvKeyOnlyWhenOneExists);
}

describe('api key texts', registerKeyTextsTests);
