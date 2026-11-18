import { test, expect, afterEach, describe } from 'bun:test';
import {
    getBatchOnDisabledIds, getDispatchedSpecs, getNormalStateText, getVersionTwo, getVersionWithResults, installFakeDom, installStubEditors, listEnabled, resetFakeDomAndPageState,
} from './batchControlsFakeDom';
import * as editors from '../editors/editors';
import { pageState } from '../page/state';

function validateInstalledDomHasStartingVersionsAndEnvKey() {
    // Step: install the fake page with an env key.
    installFakeDom(true);
    // Step: the data box holds an empty version list and the env key flag.
    const dataBox = document.getElementById('data') as unknown as { textContent: string };
    expect(JSON.parse(dataBox.textContent)).toEqual({ versions: [], hasEnvKey: true });
}

function validateInstalledDomReturnsNullForUnknownId() {
    // Step: install the fake page.
    installFakeDom(false);
    // Step: an id that is not on the page gives null.
    expect(document.getElementById('missingId')).toBeNull();
}

function validateInstalledDomButtonsStartEnabled() {
    // Step: install the fake page.
    const elements = installFakeDom(false);
    // Step: a fresh button is enabled.
    expect(elements.saveButton.disabled).toBe(false);
    expect(elements.submitButton.disabled).toBe(false);
}

function validateStubEditorsReportGivenStateText() {
    // Step: install stub editors with a state text.
    installStubEditors(getNormalStateText());
    // Step: the state editor returns that text and the questions editor returns empty braces.
    expect(editors.getStateEditor().state.doc.toString()).toBe('{"a":1}');
    expect(editors.getQuestionsEditor().state.doc.toString()).toBe('{}');
}

function validateStubEditorDispatchRecordsSpec() {
    // Step: install stub editors and send one spec to the state editor.
    installStubEditors(getNormalStateText());
    editors.getStateEditor().dispatch({ changes: { from: 0, insert: 'x' } });
    // Step: the spec shows in the recorded list.
    expect(getDispatchedSpecs()).toEqual([{ changes: { from: 0, insert: 'x' } }]);
}

function validateResetClearsFakeDomAndPageState() {
    // Step: install the fake page, set page state and record one spec.
    installFakeDom(false);
    installStubEditors(getNormalStateText());
    pageState.versions = [getVersionWithResults()];
    pageState.isBatchOn = true;
    editors.getStateEditor().dispatch({ changes: { from: 0, insert: 'x' } });
    // Step: reset.
    resetFakeDomAndPageState();
    // Step: the page globals are gone and the page state and recorded specs are empty.
    expect(typeof document).toBe('undefined');
    expect(pageState.versions).toEqual([]);
    expect(pageState.isBatchOn).toBe(false);
    expect(getDispatchedSpecs()).toEqual([]);
}

function validateListEnabledSkipsDisabledButtons() {
    // Step: install the fake page and disable one button.
    const elements = installFakeDom(false);
    elements.newButton.disabled = true;
    // Step: only the enabled id is listed.
    expect(listEnabled(elements, ['newButton', 'openButton'])).toEqual(['openButton']);
}

function validateVersionHelpersGiveDifferentStates() {
    // Step: the two versions differ by state and both hold one output.
    expect(getVersionWithResults().state).toEqual({ a: 1 });
    expect(getVersionTwo().state).toEqual({ a: 2 });
    expect(getVersionWithResults().outputs.length).toBe(1);
}

function validateBatchOnDisabledIdsAreListedOnFakePage() {
    // Step: every id in the batch-on list is a button or input on the fake page.
    const elements = installFakeDom(false);
    for (const id of getBatchOnDisabledIds()) {
        expect(elements[id]).toBeDefined();
    }
}

function registerFakeDomTests() {
    afterEach(resetFakeDomAndPageState);
    test('test_installed_dom_has_starting_versions_and_env_key', validateInstalledDomHasStartingVersionsAndEnvKey);
    test('test_installed_dom_returns_null_for_unknown_id', validateInstalledDomReturnsNullForUnknownId);
    test('test_installed_dom_buttons_start_enabled', validateInstalledDomButtonsStartEnabled);
    test('test_stub_editors_report_given_state_text', validateStubEditorsReportGivenStateText);
    test('test_stub_editor_dispatch_records_spec', validateStubEditorDispatchRecordsSpec);
    test('test_reset_clears_fake_dom_and_page_state', validateResetClearsFakeDomAndPageState);
    test('test_list_enabled_skips_disabled_buttons', validateListEnabledSkipsDisabledButtons);
    test('test_version_helpers_give_different_states', validateVersionHelpersGiveDifferentStates);
    test('test_batch_on_disabled_ids_are_listed_on_fake_page', validateBatchOnDisabledIdsAreListedOnFakePage);
}

describe('batch controls fake dom', registerFakeDomTests);
