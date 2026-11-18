import { test, expect, afterEach, describe } from 'bun:test';
import type { Provider, Version } from '../../history/playgroundHistory';
import { listProviders } from './graphValues';
import type { Answer, GraphBlock } from './graphTypes';
import { renderChart } from './graphChart';
import { createFakeNode, listByName, removeFakeDocument } from './graphChartFakeDom';
import type { FakeNode } from './graphChartFakeDom';

function createDrawnChart() {
    Object.assign(globalThis, { document: { createElementNS: createFakeNode } });
    const drawn: { svg?: FakeNode } = {};
    function replaceChildren(svg: FakeNode) {
        drawn.svg = svg;
    }
    const graphBlock = { block: {}, box: { clientHeight: 200, replaceChildren } } as unknown as GraphBlock;
    return { drawn, graphBlock };
}

function listAttributes(nodes: FakeNode[], attributeName: string) {
    const values: string[] = [];
    for (const node of nodes) {
        values.push(node.attrs[attributeName]);
    }
    return values;
}

function listTextContents(nodes: FakeNode[]) {
    const texts: string[] = [];
    for (const node of nodes) {
        texts.push(node.textContent);
    }
    return texts;
}

function validatePinnedRunsDrawMutedBarsBehindAndWidenTheSlot() {
    const { drawn, graphBlock } = createDrawnChart();
    const answers: Answer[] = [{ type: 'noul', noul: 0.8 }];
    const pinnedAnswers = [{ type: 'noul', noul: 0.3 }, { type: 'noul', noul: 0.3 }, { type: 'noul', noul: 0.3 }] as Answer[];
    const pinned = { id: 2, answers: pinnedAnswers, providers: ['SubQ', 'SubQ', 'TypeSafe'] as Provider[], keys: ['yes'] };
    const plain = renderChart(graphBlock, 'q', { type: 'noul' }, answers, null, ['TypeSafe']);
    const layout = renderChart(graphBlock, 'q', { type: 'noul' }, answers, pinned, ['TypeSafe']);
    const bars = listByName(drawn.svg!.children as FakeNode[], 'rect');
    expect(bars.length).toBe(4);
    expect(listAttributes(bars, 'fill')).toEqual(['#56B4E9', '#56B4E9', '#009E73', '#009E73']);
    expect(listAttributes(bars, 'opacity')).toEqual(['0.35', '0.35', '0.35', '1']);
    expect(layout.slot).toBeGreaterThan(plain.slot);
    expect(layout.pinned).toBe(pinned);
    expect(listByName(drawn.svg!.children as FakeNode[], 'g').length).toBe(0);
}

function validateChartMarksEachCallBarWithItsProviderLetter() {
    const { drawn, graphBlock } = createDrawnChart();
    const answers: Answer[] = [{ type: 'noul', noul: 0.8 }, { type: 'noul', noul: 0.6 }];
    const layout = renderChart(graphBlock, 'q', { type: 'noul' }, answers, null, ['SubQ', 'TypeSafe']);
    expect(listByName(drawn.svg!.children as FakeNode[], 'g').length).toBe(0);
    const labels = listByName(drawn.svg!.children as FakeNode[], 'text');
    expect(listTextContents(labels)).toEqual(['True', 'False']);
    const bars = listByName(drawn.svg!.children as FakeNode[], 'rect');
    expect(listAttributes(bars, 'fill')).toEqual(['#56B4E9', '#009E73']);
    expect(layout.providers).toEqual(['SubQ', 'TypeSafe']);
}

function validateOutputsWithoutAProviderDrawTheTypeSafeFill() {
    const { drawn, graphBlock } = createDrawnChart();
    const answers: Answer[] = [{ type: 'noul', noul: 0.8 }];
    const oldVersion = { time: 't', state: {}, questions: {}, calls: 1, outputs: [{ answers: {}, usage: { input_tokens: 1, output_tokens: 1 } }] } as unknown as Version;
    renderChart(graphBlock, 'q', { type: 'noul' }, answers, null, listProviders(oldVersion));
    const bars = listByName(drawn.svg!.children as FakeNode[], 'rect');
    expect(bars[0].attrs.fill).toBe('#009E73');
}

function registerGraphChartProvidersTests() {
    afterEach(removeFakeDocument);
    test('test_chart_colors_each_call_bar_by_provider_and_draws_no_provider_letters', validateChartMarksEachCallBarWithItsProviderLetter);
    test('test_outputs_without_a_provider_draw_the_typesafe_fill', validateOutputsWithoutAProviderDrawTheTypeSafeFill);
    test('test_pinned_runs_draw_muted_bars_behind_and_widen_the_slot', validatePinnedRunsDrawMutedBarsBehindAndWidenTheSlot);
}

describe('graphChartProviders', registerGraphChartProvidersTests);
