import { test, expect, afterEach, describe } from 'bun:test';
import {
    getBodyChildren,
    installFakeDocument,
    removeFakeDocument,
    collectAppendReferenceText,
    createJsonState,
    getStateText,
    getQuestionsText,
    createSource,
    createView,
} from './backtickTooltipFakeDom';

function getFakeDocument() {
    return (globalThis as unknown as { document: Document }).document;
}

function validateInstallAddsADocumentWithBodyAppendChild() {
    installFakeDocument();
    const node = getFakeDocument().createElement('div') as unknown as { className: string };
    getFakeDocument().body.appendChild(node as unknown as Node);
    expect(getBodyChildren()).toEqual([node as never]);
}

function validateInstallEmptiesTheBody() {
    installFakeDocument();
    getFakeDocument().body.appendChild(getFakeDocument().createElement('div'));
    installFakeDocument();
    expect(getBodyChildren().length).toBe(0);
}

function validateRemoveDeletesTheDocument() {
    installFakeDocument();
    removeFakeDocument();
    expect('document' in globalThis).toBe(false);
}

function validateCreateTextNodeHoldsItsText() {
    installFakeDocument();
    const node = getFakeDocument().createTextNode('hello');
    expect(node.textContent).toBe('hello');
}

function validateNodeRemoveTakesItOutOfTheBody() {
    installFakeDocument();
    const node = getFakeDocument().createElement('div');
    getFakeDocument().body.appendChild(node);
    node.remove();
    expect(getBodyChildren().length).toBe(0);
}

function validateNodeKeepsItsListenersByType() {
    installFakeDocument();
    const node = getFakeDocument().createElement('div');
    function logClick() {}
    node.addEventListener('click', logClick);
    expect((node as unknown as { listeners: Record<string, () => void> }).listeners.click).toBe(logClick);
}

function validateNodeBoundingRectIsFixed() {
    installFakeDocument();
    const node = getFakeDocument().createElement('div');
    expect(node.getBoundingClientRect()).toEqual({ left: 10, bottom: 20 } as never);
}

function validateCollectReturnsTextNodesAroundAReference() {
    const nodes = collectAppendReferenceText('a `x` b', { x: 1 }, {});
    expect(nodes.length).toBe(3);
    expect(nodes[1].textContent).toBe('`x`');
}

function validateJsonStateHoldsTheText() {
    expect(createJsonState('{"a": 1}').doc.toString()).toBe('{"a": 1}');
}

function validateSampleTextsAreValidJson() {
    expect(JSON.parse(getStateText()).message.text).toBe('Hello');
    expect(typeof JSON.parse(getQuestionsText()).q).toBe('string');
}

function validateCreateViewWrapsTheState() {
    expect(createView('{"b": 2}').state.doc.toString()).toBe('{"b": 2}');
}

function validateCreateSourceReturnsAFunction() {
    expect(typeof createSource(getStateText(), getQuestionsText())).toBe('function');
}

function registerFakeDomTests() {
    afterEach(removeFakeDocument);
    test('install_adds_a_document_with_body_append_child', validateInstallAddsADocumentWithBodyAppendChild);
    test('install_empties_the_body', validateInstallEmptiesTheBody);
    test('remove_deletes_the_document', validateRemoveDeletesTheDocument);
    test('create_text_node_holds_its_text', validateCreateTextNodeHoldsItsText);
    test('node_remove_takes_it_out_of_the_body', validateNodeRemoveTakesItOutOfTheBody);
    test('node_keeps_its_listeners_by_type', validateNodeKeepsItsListenersByType);
    test('node_bounding_rect_is_fixed', validateNodeBoundingRectIsFixed);
    test('collect_returns_text_nodes_around_a_reference', validateCollectReturnsTextNodesAroundAReference);
    test('json_state_holds_the_text', validateJsonStateHoldsTheText);
    test('sample_texts_are_valid_json', validateSampleTextsAreValidJson);
    test('create_view_wraps_the_state', validateCreateViewWrapsTheState);
    test('create_source_returns_a_function', validateCreateSourceReturnsAFunction);
}

describe('backtickTooltipFakeDom', registerFakeDomTests);
