import { test, expect, afterEach, describe } from 'bun:test';
import * as editors from '../editors/editors';
import { pageState } from '../page/state';
import { getHardCodedQuestions, getHardCodedState } from '../../providers/typeSafeQuery';
import { buildStubStateEditor, createDefaultVersion, createVersion, getIsoTime, installFakeDom, installQuestionsStub, removeFakeState } from './versionBoxFakeDom';

function validateInstalledDocumentFindsElementsById() {
    // Install the fake DOM, then look up a known id and an unknown id.
    const elements = installFakeDom();
    expect(document.getElementById('versionLabel')).toBe(elements.versionLabel as unknown as HTMLElement);
    expect(document.getElementById('missingId')).toBeNull();
}

function validateInstalledElementsStartEmpty() {
    // Install the fake DOM, then check every element has empty text.
    const elements = installFakeDom();
    const ids = Object.keys(elements);
    expect(ids.length).toBe(7);
    for (const id of ids)
        expect(elements[id].textContent).toBe('');
}

function validateStubStateEditorReturnsTheText() {
    // Build a stub editor, then read its document text.
    const editor = buildStubStateEditor('{"a":1}');
    expect(editor.state.doc.toString()).toBe('{"a":1}');
}

function validateVersionUsesTheFixedIsoTime() {
    // Build a version, then check its fields.
    const state = { a: 1 };
    const version = createVersion(4, state);
    expect(version.id).toBe(4);
    expect(version.calls).toBe(4);
    expect(version.time).toBe(getIsoTime());
    expect(version.state).toBe(state as never);
    expect(version.outputs).toEqual([]);
}

function validateDefaultVersionHoldsTheHardCodedData() {
    // Build the default version, then compare it to the hard-coded state and questions.
    const version = createDefaultVersion();
    expect(version.state).toEqual(getHardCodedState());
    expect(version.questions).toEqual(getHardCodedQuestions());
    expect(version.calls).toBe(0);
    expect(version.time).toBe(getIsoTime());
}

function validateQuestionsStubReturnsTheText() {
    // Install the questions stub, then read the text of the questions editor.
    installQuestionsStub('{"q":1}');
    expect(editors.getQuestionsEditor().state.doc.toString()).toBe('{"q":1}');
}

function validateQuestionsStubSilencesRender() {
    // Install the questions stub, then call render and check the spy saw one call.
    const renderSpy = installQuestionsStub('{}');
    editors.renderQuestionsJson({} as never);
    expect(renderSpy).toHaveBeenCalledTimes(1);
}

function validateRemoveFakeStateDeletesTheGlobals() {
    // Install the fake DOM, remove the state, then check the globals are gone.
    installFakeDom();
    Object.assign(globalThis, { Element: class {} });
    removeFakeState();
    expect('document' in globalThis).toBe(false);
    expect('Element' in globalThis).toBe(false);
}

function validateRemoveFakeStateResetsThePageState() {
    // Dirty the page state, remove the state, then check the page state is reset.
    pageState.versions = [createDefaultVersion()];
    pageState.index = 3;
    pageState.isDirty = true;
    removeFakeState();
    expect(pageState.versions).toEqual([]);
    expect(pageState.index).toBe(0);
    expect(pageState.isDirty).toBe(false);
    expect(pageState.editedDraft).toBeNull();
}

function registerVersionBoxFakeDomTests() {
    afterEach(removeFakeState);
    test('test_installed_document_finds_elements_by_id', validateInstalledDocumentFindsElementsById);
    test('test_installed_elements_start_empty', validateInstalledElementsStartEmpty);
    test('test_stub_state_editor_returns_the_text', validateStubStateEditorReturnsTheText);
    test('test_version_uses_the_fixed_iso_time', validateVersionUsesTheFixedIsoTime);
    test('test_default_version_holds_the_hard_coded_data', validateDefaultVersionHoldsTheHardCodedData);
    test('test_questions_stub_returns_the_text', validateQuestionsStubReturnsTheText);
    test('test_questions_stub_silences_render', validateQuestionsStubSilencesRender);
    test('test_remove_fake_state_deletes_the_globals', validateRemoveFakeStateDeletesTheGlobals);
    test('test_remove_fake_state_resets_the_page_state', validateRemoveFakeStateResetsThePageState);
}

describe('versionBox fake dom', registerVersionBoxFakeDomTests);
