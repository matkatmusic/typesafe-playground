import { test, expect } from 'bun:test';
import { getButton, getDialog, getElement, getInput } from './dom';

function validateModuleLoadsWithoutDom() {
    expect(typeof getElement).toBe('function');
    expect(typeof getButton).toBe('function');
}

function getNewButtonElement() {
    return getElement('newButton');
}

function getNewButtonAsButton() {
    return getButton('newButton');
}

function getKeyEditorInput() {
    return getInput('typeSafeKeyEditor');
}

function getUnsavedDialogElement() {
    return getDialog('unsavedDialog');
}

function validateLookupWithoutDocumentThrows() {
    expect(getNewButtonElement).toThrow();
    expect(getNewButtonAsButton).toThrow();
    expect(getKeyEditorInput).toThrow();
    expect(getUnsavedDialogElement).toThrow();
}

test('test_dom_module_loads_without_touching_the_dom', validateModuleLoadsWithoutDom);
test('test_lookup_without_a_document_throws', validateLookupWithoutDocumentThrows);
