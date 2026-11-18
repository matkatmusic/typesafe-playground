import { test, expect, afterEach, describe } from 'bun:test';
import { pageState } from '../page/state';
import { buildStubStateEditor, FakeButton, FakeInput, getIsoTime, getVersion, installFakeDom, removeFakeDom } from './submitFakeDom';

function validateInstalledDocumentFindsElementsById() {
    // Install the fake DOM, then look up a known id and an unknown id.
    const elements = installFakeDom(false);
    expect(document.getElementById('submitButton')).toBe(elements.submitButton as unknown as HTMLElement);
    expect(document.getElementById('missingId')).toBeNull();
}

function validateDataElementHoldsTheVersionAndEnvKeyFlag() {
    // Install with the flag set, then parse the data element text.
    const elements = installFakeDom(true);
    const data = JSON.parse(elements.data.textContent);
    expect(data.hasEnvKey).toBe(true);
    expect(data.versions).toEqual([getVersion()]);
}

function validateInstalledGlobalsAcceptInstanceChecks() {
    // Install the fake DOM, then check instanceof works through the global classes.
    const elements = installFakeDom(false);
    expect(elements.submitButton instanceof HTMLButtonElement).toBe(true);
    expect(elements.noteText instanceof HTMLInputElement).toBe(true);
    expect(elements.noteText instanceof FakeInput).toBe(true);
    expect(elements.submitButton instanceof FakeButton).toBe(true);
}

function validateRemoveFakeDomDeletesTheGlobals() {
    // Install the fake DOM, remove it, then check the globals are gone.
    installFakeDom(false);
    removeFakeDom();
    expect('document' in globalThis).toBe(false);
    expect('HTMLButtonElement' in globalThis).toBe(false);
    expect('HTMLInputElement' in globalThis).toBe(false);
}

function validateRemoveFakeDomRestoresFetchAndPageState() {
    // Replace fetch and dirty the page state, remove the fake DOM, then check both are reset.
    const realFetch = globalThis.fetch;
    installFakeDom(false);
    globalThis.fetch = (() => Promise.reject(new Error('stub'))) as unknown as typeof fetch;
    pageState.isDirty = true;
    pageState.versions = [getVersion()];
    pageState.index = 3;
    removeFakeDom();
    expect(globalThis.fetch).toBe(realFetch);
    expect(pageState.isDirty).toBe(false);
    expect(pageState.versions).toEqual([]);
    expect(pageState.index).toBe(0);
}

function validateVersionUsesTheFixedIsoTime() {
    // Build a version, then check its time is the fixed time.
    expect(getVersion().time).toBe(getIsoTime());
}

function validateStubStateEditorReturnsTheText() {
    // Build a stub editor, then read its document text and dispatch without error.
    const editor = buildStubStateEditor('{"a":1}');
    expect(editor.state.doc.toString()).toBe('{"a":1}');
    editor.dispatch({});
}

function registerSubmitFakeDomTests() {
    afterEach(removeFakeDom);
    test('test_installed_document_finds_elements_by_id', validateInstalledDocumentFindsElementsById);
    test('test_data_element_holds_the_version_and_env_key_flag', validateDataElementHoldsTheVersionAndEnvKeyFlag);
    test('test_installed_globals_accept_instance_checks', validateInstalledGlobalsAcceptInstanceChecks);
    test('test_remove_fake_dom_deletes_the_globals', validateRemoveFakeDomDeletesTheGlobals);
    test('test_remove_fake_dom_restores_fetch_and_page_state', validateRemoveFakeDomRestoresFetchAndPageState);
    test('test_version_uses_the_fixed_iso_time', validateVersionUsesTheFixedIsoTime);
    test('test_stub_state_editor_returns_the_text', validateStubStateEditorReturnsTheText);
}

describe('submit fake dom', registerSubmitFakeDomTests);
