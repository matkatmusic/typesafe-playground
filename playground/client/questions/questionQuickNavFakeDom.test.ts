import { describe, test, expect, afterEach } from 'bun:test';
import { createState, installFakeDocument, installStubQuestionsEditor, readOptionValues, removeFakeState } from './questionQuickNavFakeDom';
import type { FakeElement } from './questionQuickNavFakeDom';
import { EditorView } from '@codemirror/view';
import * as editors from '../editors/editors';

function validateCreateStateHoldsTheGivenDocument() {
    const state = createState('{"a": 1}');
    expect(state.doc.toString()).toBe('{"a": 1}');
}

function validateInstalledDocumentCreatesElementsWithEmptyDefaults() {
    installFakeDocument();
    const element = document.createElement('option') as unknown as FakeElement;
    expect(element.value).toBe('');
    expect(element.textContent).toBe('');
    expect(element.hidden).toBe(false);
    expect(element.children).toEqual([]);
}

function validateFakeElementStoresAttributesListenersAndChildren() {
    installFakeDocument();
    const element = document.createElement('select') as unknown as FakeElement;
    function logChange() {}
    const child = document.createElement('option');
    element.setAttribute('aria-label', 'jump');
    element.addEventListener('change', logChange);
    element.replaceChildren(child);
    expect(element.attrs['aria-label']).toBe('jump');
    expect(element.listeners['change']).toBe(logChange);
    expect(element.children).toEqual([child]);
}

function validateInstalledDocumentFindsOnlyTheErrorLine() {
    const errorLine = installFakeDocument();
    expect(document.getElementById('errorLine')).toBe(errorLine as unknown as HTMLElement);
    expect(document.getElementById('other')).toBeNull();
}

function validateRemoveFakeStateDeletesTheFakeDocument() {
    installFakeDocument();
    expect(typeof document).toBe('object');
    removeFakeState();
    expect(typeof document).toBe('undefined');
}

function validateStubQuestionsEditorIsReturnedByGetQuestionsEditor() {
    const stub = installStubQuestionsEditor('{"a": 1}');
    expect(editors.getQuestionsEditor()).toBe(stub.view as unknown as ReturnType<typeof editors.getQuestionsEditor>);
}

function validateStubDispatchRecordsTheScrollPosition() {
    const stub = installStubQuestionsEditor('{"a": 1, "b": 2}');
    const position = 8;
    stub.view.dispatch({ effects: [EditorView.scrollIntoView(position)] });
    expect(stub.scrolledPositions).toEqual([position]);
}

function validateReadOptionValuesListsChildValuesInOrder() {
    installFakeDocument();
    const select = document.createElement('select') as unknown as FakeElement;
    const first = document.createElement('option') as unknown as FakeElement;
    const second = document.createElement('option') as unknown as FakeElement;
    first.value = 'a';
    second.value = 'b';
    select.replaceChildren(first, second);
    expect(readOptionValues(select)).toEqual(['a', 'b']);
}

function registerFakeDomTests() {
    afterEach(removeFakeState);
    test('create_state_holds_the_given_document', validateCreateStateHoldsTheGivenDocument);
    test('installed_document_creates_elements_with_empty_defaults', validateInstalledDocumentCreatesElementsWithEmptyDefaults);
    test('fake_element_stores_attributes_listeners_and_children', validateFakeElementStoresAttributesListenersAndChildren);
    test('installed_document_finds_only_the_error_line', validateInstalledDocumentFindsOnlyTheErrorLine);
    test('remove_fake_state_deletes_the_fake_document', validateRemoveFakeStateDeletesTheFakeDocument);
    test('stub_questions_editor_is_returned_by_get_questions_editor', validateStubQuestionsEditorIsReturnedByGetQuestionsEditor);
    test('stub_dispatch_records_the_scroll_position', validateStubDispatchRecordsTheScrollPosition);
    test('read_option_values_lists_child_values_in_order', validateReadOptionValuesListsChildValuesInOrder);
}

describe('questionQuickNavFakeDom', registerFakeDomTests);
