import { describe, test, expect, afterEach } from 'bun:test';
import type { Answer, GraphBlock } from './graphTypes';
import { renderChart, listSortedKeys } from './graphChart';
import { computePlotHeight, getLeftMargin, getTopMargin } from './graphGeometry';
import { graphState } from './graphState';
import { createFakeNode, renderNoulChartNodes, listByName, removeFakeDocument } from './graphChartFakeDom';
import type { FakeNode } from './graphChartFakeDom';

function listTextContents(nodes: FakeNode[]): string[] {
    const textContents: string[] = [];
    for (const node of nodes) {
        textContents.push(node.textContent);
    }
    return textContents;
}

function validateKeysSortByAverageDescending() {
    const first: Answer = { type: 'choice', choice: 'a', confidence: 1, probabilities: { a: 0.2, b: 0.8, c: 0.5 } };
    const second: Answer = { type: 'choice', choice: 'b', confidence: 1, probabilities: { a: 0.4, b: 0.6, c: 0.5 } };
    expect(listSortedKeys([first, second])).toEqual(['b', 'c', 'a']);
}

function validateNoulDrawsOneBarAtTheNoulValue() {
    const bars = listByName(renderNoulChartNodes(), 'rect');
    const plotH = computePlotHeight(200);
    expect(bars.length).toBe(1);
    expect(Number(bars[0].attrs.height)).toBeCloseTo(plotH * 0.3);
    expect(Number(bars[0].attrs.y)).toBeCloseTo(getTopMargin() + plotH * 0.2);
}

function validateNoulDrawsAnAxisWithTrueAndFalseAndAMiddleBaseline() {
    const nodes = renderNoulChartNodes();
    const plotH = computePlotHeight(200);
    const lines = listByName(nodes, 'line');
    expect(lines.length).toBe(2);
    expect(lines[0].attrs).toMatchObject({ x1: String(getLeftMargin()), x2: String(getLeftMargin()), y1: String(getTopMargin()), y2: String(getTopMargin() + plotH) });
    expect(Number(lines[1].attrs.y1)).toBeCloseTo(getTopMargin() + plotH * 0.5);
    expect(lines[1].attrs.y2).toBe(lines[1].attrs.y1);
    const labels = listByName(nodes, 'text');
    expect(listTextContents(labels)).toEqual(['True', 'False']);
    expect(Number(labels[0].attrs.y)).toBeLessThan(getTopMargin());
    expect(Number(labels[1].attrs.y)).toBeGreaterThan(getTopMargin() + plotH);
}

function validateAverageAddsABarAndRangeLine() {
    graphState.averageShownByName.q = true;
    const nodes = renderNoulChartNodes();
    expect(listByName(nodes, 'rect').length).toBe(2);
    const noulAxisLines = 2;
    expect(listByName(nodes, 'line').length).toBe(noulAxisLines + 1);
}

function validateOtherQuestionsStillDrawTheNumberTicks() {
    Object.assign(globalThis, { document: { createElementNS: createFakeNode } });
    const drawn: { svg?: FakeNode } = {};
    function replaceChildren(svg: FakeNode) {
        drawn.svg = svg;
    }
    const graphBlock = { block: {}, box: { clientHeight: 200, replaceChildren } } as unknown as GraphBlock;
    const answers: Answer[] = [{ type: 'choice', choice: 'a', confidence: 1, probabilities: { a: 0.8 } }];
    const layout = renderChart(graphBlock, 'q', { type: 'choice', criteria: { a: 'x' } }, answers, null, ['TypeSafe']);
    const labels = listByName(drawn.svg!.children as FakeNode[], 'text');
    expect(listTextContents(labels)).toEqual(['0.0', '0.2', '0.4', '0.6', '0.8', '1.0']);
    expect(layout.baseline).toBe(0);
}

function validateLayoutHoldsWhatTheInfoBoxNeeds() {
    Object.assign(globalThis, { document: { createElementNS: createFakeNode } });
    const graphBlock = { block: {}, box: { clientHeight: 200, replaceChildren() {} } } as unknown as GraphBlock;
    const answers: Answer[] = [{ type: 'noul', noul: 0.8 }];
    const layout = renderChart(graphBlock, 'q', { type: 'noul' }, answers, null, ['TypeSafe']);
    expect(layout.keys).toEqual(['yes']);
    expect(layout.plotH).toBe(computePlotHeight(200));
    expect(layout.isAverageShown).toBe(false);
    expect(layout.baseline).toBe(0.5);
    expect(layout.answers).toBe(answers);
}

function registerGraphChartTests() {
    afterEach(removeFakeDocument);
    test('test_keys_sort_by_average_descending', validateKeysSortByAverageDescending);
    test('test_noul_output_draws_one_bar_at_the_noul_value', validateNoulDrawsOneBarAtTheNoulValue);
    test('test_noul_draws_an_axis_with_true_and_false_and_a_middle_baseline', validateNoulDrawsAnAxisWithTrueAndFalseAndAMiddleBaseline);
    test('test_other_questions_still_draw_the_number_ticks', validateOtherQuestionsStillDrawTheNumberTicks);
    test('test_average_adds_a_bar_and_a_range_line', validateAverageAddsABarAndRangeLine);
    test('test_layout_holds_what_the_info_box_needs', validateLayoutHoldsWhatTheInfoBoxNeeds);
}

describe('graphChart', registerGraphChartTests);
