import { describe, test, expect, afterEach } from 'bun:test';
import { getQuestionsEditor, getStateEditor } from '../editors/editors';
import { buildEmptyPendingNotes, pageState } from '../page/state';
import { installFakeDom, installPage, removeFakeState, triggerNewButtonClick } from './notesButtonSupport';

function validateInstallFakeDomProvidesDialogTitleAndTextArea() {
    const { dialog, title, textArea } = installFakeDom();
    expect(dialog.isOpen).toBe(false);
    expect(title.textContent).toBe('');
    expect(textArea.value).toBe('');
    expect(document.getElementById('notesDialog')).toBe(dialog as unknown as HTMLElement);
    expect(document.getElementById('missing')).toBe(null);
}

function triggerNothing() {}

function validateInstallFakeDomCreatesButtonsThatRecordClickListeners() {
    installFakeDom();
    const button = document.createElement('button');
    expect(button.id).toBe('');
    button.addEventListener('click', triggerNothing);
    expect(typeof (button as unknown as { clickListener: unknown }).clickListener).toBe('function');
}

function validateInstallPageFillsEditorsAndOneSavedVersion() {
    installPage('{"a":1}');
    expect(getStateEditor().state.doc.toString()).toBe('{"a":1}');
    expect(getQuestionsEditor().state.doc.toString()).toBe('{}');
    expect(pageState.versions.length).toBe(1);
    expect(pageState.versions[0].stateNote).toBe('saved');
    expect(pageState.index).toBe(0);
}

function validateRemoveFakeStateClearsPageStateAndGlobals() {
    installFakeDom();
    installPage('{"a":1}');
    pageState.pendingNotes.state = 'pending';
    removeFakeState();
    expect(pageState.versions.length).toBe(0);
    expect(pageState.pendingNotes).toEqual(buildEmptyPendingNotes());
    expect('document' in globalThis).toBe(false);
}

function validateTriggerNewButtonClickOpensTheDialog() {
    const { dialog } = installFakeDom();
    installPage('{"a":1}');
    const button = triggerNewButtonClick();
    expect(button.id).toBe('stateNotesButton');
    expect(dialog.isOpen).toBe(true);
}

function registerNotesButtonSupportTests() {
    afterEach(removeFakeState);
    test('test_install_fake_dom_provides_dialog_title_and_text_area', validateInstallFakeDomProvidesDialogTitleAndTextArea);
    test('test_install_fake_dom_creates_buttons_that_record_click_listeners', validateInstallFakeDomCreatesButtonsThatRecordClickListeners);
    test('test_install_page_fills_editors_and_one_saved_version', validateInstallPageFillsEditorsAndOneSavedVersion);
    test('test_remove_fake_state_clears_page_state_and_globals', validateRemoveFakeStateClearsPageStateAndGlobals);
    test('test_trigger_new_button_click_opens_the_dialog', validateTriggerNewButtonClickOpensTheDialog);
}

describe('notes button support', registerNotesButtonSupportTests);
