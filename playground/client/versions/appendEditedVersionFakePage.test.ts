import { describe, test, expect, afterEach } from 'bun:test';
import * as editors from '../editors/editors';
import { pageState } from '../page/state';
import { buildVersion, installOpenFetch, installPage, resetFakePage } from './appendEditedVersionFakePage';

function validateBuildVersionHasTheOldNote() {
    const version = buildVersion();
    expect(version.note).toBe('old note');
    expect(version.state).toEqual({ a: 1 });
    expect(version.calls).toBe(2);
    expect(version.outputs).toEqual([]);
}

function validateInstallPageSeedsOneVersionAtIndexZero() {
    installPage('{}', '{}');
    expect(pageState.versions.length).toBe(1);
    expect(pageState.index).toBe(0);
    expect(pageState.versions[0]).toEqual(buildVersion());
}

function validateInstallPageStubsTheEditorTexts() {
    installPage('state text', 'questions text');
    expect(editors.getStateEditor().state.doc.toString()).toBe('state text');
    expect(editors.getQuestionsEditor().state.doc.toString()).toBe('questions text');
}

function validateInstallPageGivesOneSharedErrorLine() {
    const { errorLine } = installPage('{}', '{}');
    const foundLine = document.getElementById('anything');
    expect(foundLine).toBe(errorLine as unknown as HTMLElement);
    expect(errorLine.textContent).toBe('');
}

function validateInstallPageSpiesAreNotCalledYet() {
    const { refreshSpy, arrowsSpy, pinSpy, renderSpies } = installPage('{}', '{}');
    expect(refreshSpy).not.toHaveBeenCalled();
    expect(arrowsSpy).not.toHaveBeenCalled();
    expect(pinSpy).not.toHaveBeenCalled();
    expect(renderSpies.note).not.toHaveBeenCalled();
}

function validateResetFakePageClearsTheVersionsAndTheDocument() {
    installPage('{}', '{}');
    resetFakePage();
    expect(pageState.versions).toEqual([]);
    expect(pageState.index).toBe(0);
    expect('document' in globalThis).toBe(false);
}

async function validateInstallOpenFetchRecordsTheRequestAndEchoesTheVersions() {
    const seen = installOpenFetch();
    const response = await fetch('/some/path', { method: 'POST', body: JSON.stringify({ versions: [1, 2] }) });
    expect(seen).toEqual([{ path: '/some/path', body: { versions: [1, 2] } }]);
    expect(await response.json()).toEqual({ versions: [1, 2] });
}

function registerFakePageTests() {
    afterEach(resetFakePage);
    test('test_build_version_has_the_old_note', validateBuildVersionHasTheOldNote);
    test('test_install_page_seeds_one_version_at_index_zero', validateInstallPageSeedsOneVersionAtIndexZero);
    test('test_install_page_stubs_the_editor_texts', validateInstallPageStubsTheEditorTexts);
    test('test_install_page_gives_one_shared_error_line', validateInstallPageGivesOneSharedErrorLine);
    test('test_install_page_spies_are_not_called_yet', validateInstallPageSpiesAreNotCalledYet);
    test('test_reset_fake_page_clears_the_versions_and_the_document', validateResetFakePageClearsTheVersionsAndTheDocument);
    test('test_install_open_fetch_records_the_request_and_echoes_the_versions', validateInstallOpenFetchRecordsTheRequestAndEchoesTheVersions);
}

describe('appendEditedVersionFakePage', registerFakePageTests);
