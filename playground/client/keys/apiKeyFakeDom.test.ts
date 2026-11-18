import { test, expect, afterEach, describe } from 'bun:test';
import { FakeButton, FakeInput, installFakeDom, removeFakeDom } from './apiKeyFakeDom';

function validateInstalledDocumentFindsElementsById() {
    // Install the fake DOM, then look up known ids and an unknown id.
    const elements = installFakeDom(false);
    expect(document.getElementById('submitButton')).toBe(elements.submitButton as unknown as HTMLElement);
    expect(document.getElementById('providerSwitch')).toBe(elements.providerSwitch as unknown as HTMLElement);
    expect(document.getElementById('missingId')).toBeNull();
}

function validateDataElementHoldsTheEnvKeyFlags() {
    // Install with both flags set, then parse the data element text.
    const elements = installFakeDom(true, true);
    expect(JSON.parse(elements.data.textContent)).toEqual({ versions: [], hasEnvKey: true, hasSubqEnvKey: true });
}

function validateSubqFlagDefaultsToFalse() {
    // Install with one argument, then check the second flag is false.
    const elements = installFakeDom(true);
    expect(JSON.parse(elements.data.textContent).hasSubqEnvKey).toBe(false);
}

function validateInstalledGlobalsAcceptInstanceChecks() {
    // Install the fake DOM, then check instanceof works through the global classes.
    const elements = installFakeDom(false);
    expect(elements.submitButton instanceof HTMLButtonElement).toBe(true);
    expect(elements.providerSwitch instanceof HTMLInputElement).toBe(true);
    expect(elements.submitButton instanceof FakeButton).toBe(true);
    expect(elements.providerSwitch instanceof FakeInput).toBe(true);
}

function validateRemoveFakeDomDeletesTheGlobals() {
    // Install the fake DOM, remove it, then check the globals are gone.
    installFakeDom(false);
    removeFakeDom();
    expect('document' in globalThis).toBe(false);
    expect('HTMLButtonElement' in globalThis).toBe(false);
    expect('HTMLInputElement' in globalThis).toBe(false);
}

function registerFakeDomTests() {
    afterEach(removeFakeDom);
    test('test_installed_document_finds_elements_by_id', validateInstalledDocumentFindsElementsById);
    test('test_data_element_holds_the_env_key_flags', validateDataElementHoldsTheEnvKeyFlags);
    test('test_subq_flag_defaults_to_false', validateSubqFlagDefaultsToFalse);
    test('test_installed_globals_accept_instance_checks', validateInstalledGlobalsAcceptInstanceChecks);
    test('test_remove_fake_dom_deletes_the_globals', validateRemoveFakeDomDeletesTheGlobals);
}

describe('api key fake dom', registerFakeDomTests);
