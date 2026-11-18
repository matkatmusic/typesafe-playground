import { test, expect, afterEach, describe } from 'bun:test';
import { graphState } from './graphState';
import { createFakeNode, listByName, removeFakeDocument, renderNoulChartNodes } from './graphChartFakeDom';

function validateFakeNodeRecordsNameAttributesAndChildren() {
    const node = createFakeNode('svg-namespace', 'rect');
    const child = createFakeNode('svg-namespace', 'text');
    node.setAttribute('width', '10');
    node.appendChild(child);
    expect(node.name).toBe('rect');
    expect(node.attrs).toEqual({ width: '10' });
    expect(node.children).toEqual([child]);
    expect(node.textContent).toBe('');
}

function validateListByNameReturnsOnlyMatchingNodes() {
    const rect = createFakeNode('ns', 'rect');
    const text = createFakeNode('ns', 'text');
    const secondRect = createFakeNode('ns', 'rect');
    expect(listByName([rect, text, secondRect], 'rect')).toEqual([rect, secondRect]);
    expect(listByName([rect, text, secondRect], 'circle')).toEqual([]);
}

function validateRemovingTheFakeDocumentResetsDocumentAndAverageShown() {
    Object.assign(globalThis, { document: {} });
    graphState.averageShownByName = { q: true };
    removeFakeDocument();
    expect('document' in globalThis).toBe(false);
    expect(graphState.averageShownByName).toEqual({});
}

function validateRenderingNoulChartDrawsSvgChildren() {
    const nodes = renderNoulChartNodes();
    expect(nodes.length).toBeGreaterThan(0);
    expect(listByName(nodes, 'rect').length).toBeGreaterThan(0);
}

function registerChartFakeDomTests() {
    afterEach(removeFakeDocument);
    test('test_fake_node_records_name_attributes_and_children', validateFakeNodeRecordsNameAttributesAndChildren);
    test('test_list_by_name_returns_only_matching_nodes', validateListByNameReturnsOnlyMatchingNodes);
    test('test_removing_the_fake_document_resets_document_and_average_shown', validateRemovingTheFakeDocumentResetsDocumentAndAverageShown);
    test('test_rendering_noul_chart_draws_svg_children', validateRenderingNoulChartDrawsSvgChildren);
}

describe('graphChartFakeDom', registerChartFakeDomTests);
