import { test, expect, afterEach, describe } from 'bun:test';
import { graphState } from './graphState';
import { createFakeElement, getFakeElementById, getVersion, installFakeDocument, removeFakeDocument } from './graphBlockFakeDom';

function validateFakeElementRecordsClassesAttributesAndChildren() {
    const element = createFakeElement();
    const child = createFakeElement();
    element.classList.add('box');
    element.setAttribute('role', 'main');
    element.appendChild(child);
    expect(element.classes).toEqual(['box']);
    expect(element.attrs).toEqual({ role: 'main' });
    expect(element.children).toEqual([child]);
}

function validateFakeElementStoresListenersByType() {
    const element = createFakeElement();
    let clickCount = 0;
    function countClick() {
        clickCount++;
    }
    element.addEventListener('click', countClick);
    element.listeners.click();
    expect(clickCount).toBe(1);
}

function validateInstalledDocumentCreatesTextNodes() {
    installFakeDocument();
    const textNode = document.createTextNode('hello');
    expect(textNode.textContent).toBe('hello');
}

function validateGetElementByIdReturnsTheSameElementForTheSameId() {
    installFakeDocument();
    const first = getFakeElementById('a');
    const second = document.getElementById('a');
    expect(second as unknown).toBe(first);
    expect(getFakeElementById('b')).not.toBe(first);
}

function validateRemovingTheFakeDocumentResetsDocumentAndGraphState() {
    installFakeDocument();
    const before = getFakeElementById('a');
    graphState.collapsedByName.q = true;
    graphState.isReferencesReplaced = true;
    removeFakeDocument();
    expect('document' in globalThis).toBe(false);
    expect(graphState.collapsedByName).toEqual({});
    expect(graphState.isReferencesReplaced).toBe(false);
    expect(getFakeElementById('a')).not.toBe(before);
}

function validateGetVersionReturnsAnEmptyVersion() {
    expect(getVersion()).toEqual({ time: 'now', state: {}, questions: {}, calls: 0, outputs: [] });
}

function registerFakeDomTests() {
    afterEach(removeFakeDocument);
    test('test_fake_element_records_classes_attributes_and_children', validateFakeElementRecordsClassesAttributesAndChildren);
    test('test_fake_element_stores_listeners_by_type', validateFakeElementStoresListenersByType);
    test('test_installed_document_creates_text_nodes', validateInstalledDocumentCreatesTextNodes);
    test('test_get_element_by_id_returns_the_same_element_for_the_same_id', validateGetElementByIdReturnsTheSameElementForTheSameId);
    test('test_removing_the_fake_document_resets_document_and_graph_state', validateRemovingTheFakeDocumentResetsDocumentAndGraphState);
    test('test_get_version_returns_an_empty_version', validateGetVersionReturnsAnEmptyVersion);
}

describe('graphBlockFakeDom', registerFakeDomTests);
