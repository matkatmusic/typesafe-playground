import { describe, test, expect, afterEach } from 'bun:test';
import { pageState } from '../page/state';
import { getIsoTime, buildVersion, installOneVersionWithAnEditedState, removeFakeState } from './editedVersionStopSetup';

function validateGetIsoTimeReturnsTheFixedTime() {
    expect(getIsoTime()).toBe('2026-03-04T05:06:07.000Z');
}

function validateBuildVersionUsesTheFixedTimeAndOneCall() {
    const version = buildVersion();
    expect(version.time).toBe(getIsoTime());
    expect(version.calls).toBe(1);
    expect(version.state).toEqual({ a: 1 });
}

function validateInstallPutsOneVersionAndTheEditedTextsOnThePage() {
    const { texts } = installOneVersionWithAnEditedState();
    expect(pageState.versions.length).toBe(1);
    expect(pageState.index).toBe(0);
    expect(texts.state).toBe('{"a": 2}');
}

function validateInstallProvidesAFakeDocumentWithTheButtons() {
    const { elements } = installOneVersionWithAnEditedState();
    expect(document.getElementById('submitButton')).toBe(elements.submitButton as unknown as HTMLElement);
    expect(document.getElementById('missing')).toBeNull();
}

function validateRemoveFakeStateResetsThePage() {
    installOneVersionWithAnEditedState();
    removeFakeState();
    expect(pageState.versions).toEqual([]);
    expect(pageState.index).toBe(0);
    expect(pageState.editedDraft).toBeNull();
    expect(typeof document).toBe('undefined');
}

function registerEditedVersionStopSetupTests() {
    afterEach(removeFakeState);
    test('test_get_iso_time_returns_the_fixed_time', validateGetIsoTimeReturnsTheFixedTime);
    test('test_build_version_uses_the_fixed_time_and_one_call', validateBuildVersionUsesTheFixedTimeAndOneCall);
    test('test_install_puts_one_version_and_the_edited_texts_on_the_page', validateInstallPutsOneVersionAndTheEditedTextsOnThePage);
    test('test_install_provides_a_fake_document_with_the_buttons', validateInstallProvidesAFakeDocumentWithTheButtons);
    test('test_remove_fake_state_resets_the_page', validateRemoveFakeStateResetsThePage);
}

describe('editedVersionStopSetup', registerEditedVersionStopSetupTests);
