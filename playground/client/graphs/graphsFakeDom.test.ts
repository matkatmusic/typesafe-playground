import { test, expect, afterEach, describe } from 'bun:test';
import { graphState } from './graphState';
import { FakeElement, createChartRecorder, createEmptyVersion, createFilledVersion, createTwoQuestionsVersion, installFakeDocument, removeFakeDocument } from './graphsFakeDom';
import type { ChartLayout } from './graphTypes';

function validateFakeElementRecordsClassesAttributesAndChildren() {
    const element = new FakeElement();
    const child = new FakeElement();
    element.classList.add('box');
    element.setAttribute('role', 'main');
    element.appendChild(child);
    expect(element.classes).toEqual(['box']);
    expect(element.attrs).toEqual({ role: 'main' });
    expect(element.children).toEqual([child]);
}

function validateReplaceChildrenSwapsAllChildren() {
    const element = new FakeElement();
    const replacement = new FakeElement();
    element.appendChild(new FakeElement());
    element.replaceChildren(replacement);
    expect(element.children).toEqual([replacement]);
}

function validateFakeElementStoresListenersByType() {
    const element = new FakeElement();
    let clickCount = 0;
    function countClick() {
        clickCount++;
    }
    element.addEventListener('click', countClick);
    element.listeners.click();
    expect(clickCount).toBe(1);
}

function validateInstalledDocumentCreatesNamedElements() {
    installFakeDocument();
    const svgElement = document.createElementNS('ns', 'svg') as unknown as FakeElement;
    const divElement = document.createElement('div') as unknown as FakeElement;
    expect(svgElement.name).toBe('svg');
    expect(divElement.name).toBe('div');
}

function validateInstalledDocumentCreatesTextNodes() {
    installFakeDocument();
    const textNode = document.createTextNode('hello') as unknown as FakeElement;
    expect(textNode.textContent).toBe('hello');
}

function validateRemovingTheFakeDocumentResetsDocumentAndGraphState() {
    installFakeDocument();
    graphState.collapsedByName.q = true;
    graphState.averageShownByName.q = true;
    removeFakeDocument();
    expect('document' in globalThis).toBe(false);
    expect(graphState.collapsedByName).toEqual({});
    expect(graphState.averageShownByName).toEqual({});
}

function validateEmptyVersionHasNoCallsOrOutputs() {
    expect(createEmptyVersion()).toEqual({ time: 'now', state: {}, questions: {}, calls: 0, outputs: [] });
}

function validateFilledVersionHasOneCallAndOneOutput() {
    const version = createFilledVersion();
    expect(version.calls).toBe(1);
    expect(version.outputs.length).toBe(1);
}

function validateTwoQuestionsVersionHasTwoQuestions() {
    expect(Object.keys(createTwoQuestionsVersion().questions)).toEqual(['q', 'other']);
}

function validateChartRecorderCollectsEachDrawnBatch() {
    const drawn: ChartLayout[][] = [];
    const recordCharts = createChartRecorder(drawn);
    const batch: ChartLayout[] = [];
    recordCharts(batch);
    expect(drawn).toEqual([batch]);
}

function registerGraphsFakeDomTests() {
    afterEach(removeFakeDocument);
    test('test_fake_element_records_classes_attributes_and_children', validateFakeElementRecordsClassesAttributesAndChildren);
    test('test_replace_children_swaps_all_children', validateReplaceChildrenSwapsAllChildren);
    test('test_fake_element_stores_listeners_by_type', validateFakeElementStoresListenersByType);
    test('test_installed_document_creates_named_elements', validateInstalledDocumentCreatesNamedElements);
    test('test_installed_document_creates_text_nodes', validateInstalledDocumentCreatesTextNodes);
    test('test_removing_the_fake_document_resets_document_and_graph_state', validateRemovingTheFakeDocumentResetsDocumentAndGraphState);
    test('test_empty_version_has_no_calls_or_outputs', validateEmptyVersionHasNoCallsOrOutputs);
    test('test_filled_version_has_one_call_and_one_output', validateFilledVersionHasOneCallAndOneOutput);
    test('test_two_questions_version_has_two_questions', validateTwoQuestionsVersionHasTwoQuestions);
    test('test_chart_recorder_collects_each_drawn_batch', validateChartRecorderCollectsEachDrawnBatch);
}

describe('graphsFakeDom', registerGraphsFakeDomTests);
