import { test, expect, afterEach } from 'bun:test';
import type { Provider, Version } from '../../history/playgroundHistory';
import { listProviders } from './graphValues';
import type { Answer, GraphBlock } from './graphTypes';
import { renderChart, listSortedKeys } from './graphChart';
import { computePlotHeight, LEFT, TOP } from './graphGeometry';
import { graphState } from './graphState';

function createFakeNode(namespace: string, name: string) {
  const attrs: Record<string, string> = {};
  const children: unknown[] = [];
  return { name, attrs, children, textContent: '', setAttribute(key: string, value: string) {
    attrs[key] = value;
  }, appendChild(child: unknown) {
    children.push(child);
  } };
}

type FakeNode = ReturnType<typeof createFakeNode>;

function removeFakeDocument() {
  Reflect.deleteProperty(globalThis, 'document');
  graphState.averageShownByName = {};
}

function drawNoulChart(): FakeNode[] {
  Object.assign(globalThis, { document: { createElementNS: createFakeNode } });
  const drawn: { svg?: FakeNode } = {};
  function replaceChildren(svg: FakeNode) {
    drawn.svg = svg;
  }
  const graphBlock = { block: {}, box: { clientHeight: 200, replaceChildren } } as unknown as GraphBlock;
  const answers: Answer[] = [{ type: 'noul', noul: 0.8 }];
  renderChart(graphBlock, 'q', { type: 'noul' }, answers, null, ['TypeSafe']);
  return drawn.svg!.children as FakeNode[];
}

function listByName(nodes: FakeNode[], name: string): FakeNode[] {
  const found: FakeNode[] = [];
  for (const node of nodes) {
    if (node.name === name)
      found.push(node);
  }
  return found;
}

function validateKeysSortByAverageDescending() {
  const first: Answer = { type: 'choice', choice: 'a', confidence: 1, probabilities: { a: 0.2, b: 0.8, c: 0.5 } };
  const second: Answer = { type: 'choice', choice: 'b', confidence: 1, probabilities: { a: 0.4, b: 0.6, c: 0.5 } };
  expect(listSortedKeys([first, second])).toEqual(['b', 'c', 'a']);
}

function validateNoulDrawsOneBarAtTheNoulValue() {
  const bars = listByName(drawNoulChart(), 'rect');
  const plotH = computePlotHeight(200);
  expect(bars.length).toBe(1);
  expect(Number(bars[0].attrs.height)).toBeCloseTo(plotH * 0.3);
  expect(Number(bars[0].attrs.y)).toBeCloseTo(TOP + plotH * 0.2);
}

function validateNoulDrawsAnAxisWithTrueAndFalseAndAMiddleBaseline() {
  const nodes = drawNoulChart();
  const plotH = computePlotHeight(200);
  const lines = listByName(nodes, 'line');
  expect(lines.length).toBe(2);
  expect(lines[0].attrs).toMatchObject({ x1: String(LEFT), x2: String(LEFT), y1: String(TOP), y2: String(TOP + plotH) });
  expect(Number(lines[1].attrs.y1)).toBeCloseTo(TOP + plotH * 0.5);
  expect(lines[1].attrs.y2).toBe(lines[1].attrs.y1);
  const labels = listByName(nodes, 'text');
  expect(labels.map((label) => label.textContent)).toEqual(['True', 'False']);
  expect(Number(labels[0].attrs.y)).toBeLessThan(TOP);
  expect(Number(labels[1].attrs.y)).toBeGreaterThan(TOP + plotH);
}

function validateAverageAddsABarAndRangeLine() {
  graphState.averageShownByName.q = true;
  const nodes = drawNoulChart();
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
  expect(labels.map((label) => label.textContent)).toEqual(['0.0', '0.2', '0.4', '0.6', '0.8', '1.0']);
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

function validatePinnedRunsDrawMutedBarsBehindAndWidenTheSlot() {
  Object.assign(globalThis, { document: { createElementNS: createFakeNode } });
  const drawn: { svg?: FakeNode } = {};
  function replaceChildren(svg: FakeNode) {
    drawn.svg = svg;
  }
  const graphBlock = { block: {}, box: { clientHeight: 200, replaceChildren } } as unknown as GraphBlock;
  const answers: Answer[] = [{ type: 'noul', noul: 0.8 }];
  const pinned = { id: 2, answers: [{ type: 'noul', noul: 0.3 }, { type: 'noul', noul: 0.3 }, { type: 'noul', noul: 0.3 }] as Answer[], providers: ['SubQ', 'SubQ', 'TypeSafe'] as Provider[], keys: ['yes'] };
  const plain = renderChart(graphBlock, 'q', { type: 'noul' }, answers, null, ['TypeSafe']);
  const layout = renderChart(graphBlock, 'q', { type: 'noul' }, answers, pinned, ['TypeSafe']);
  const bars = listByName(drawn.svg!.children as FakeNode[], 'rect');
  expect(bars.length).toBe(4);
  // expect(bars[0].attrs.fill).toBe('var(--text-muted)');
  // expect(bars[3].attrs.fill).toBe('var(--score)');
  // expect(bars.map((bar) => bar.attrs.fill)).toEqual(['rgb(77, 121, 57)', 'rgb(77, 121, 57)', 'rgb(201, 112, 157)', 'rgb(201, 112, 157)']);
  expect(bars.map((bar) => bar.attrs.fill)).toEqual(['#56B4E9', '#56B4E9', '#009E73', '#009E73']);
  expect(bars.map((bar) => bar.attrs.opacity)).toEqual(['0.35', '0.35', '0.35', '1']);
  expect(layout.slot).toBeGreaterThan(plain.slot);
  expect(layout.pinned).toBe(pinned);
  expect(listByName(drawn.svg!.children as FakeNode[], 'g').length).toBe(0);
}

function validateChartMarksEachCallBarWithItsProviderLetter() {
  Object.assign(globalThis, { document: { createElementNS: createFakeNode } });
  const drawn: { svg?: FakeNode } = {};
  function replaceChildren(svg: FakeNode) {
    drawn.svg = svg;
  }
  const graphBlock = { block: {}, box: { clientHeight: 200, replaceChildren } } as unknown as GraphBlock;
  const answers: Answer[] = [{ type: 'noul', noul: 0.8 }, { type: 'noul', noul: 0.6 }];
  const layout = renderChart(graphBlock, 'q', { type: 'noul' }, answers, null, ['SubQ', 'TypeSafe']);
  // const group = listByName(drawn.svg!.children as FakeNode[], 'g')[0];
  // expect(listByName(group.children as FakeNode[], 'text').map((letter) => letter.textContent)).toEqual(['s', 't']);
  expect(listByName(drawn.svg!.children as FakeNode[], 'g').length).toBe(0);
  expect(listByName(drawn.svg!.children as FakeNode[], 'text').map((label) => label.textContent)).toEqual(['True', 'False']);
  const bars = listByName(drawn.svg!.children as FakeNode[], 'rect');
  // expect(bars.map((bar) => bar.attrs.fill)).toEqual(['rgb(77, 121, 57)', 'rgb(201, 112, 157)']);
  expect(bars.map((bar) => bar.attrs.fill)).toEqual(['#56B4E9', '#009E73']);
  expect(layout.providers).toEqual(['SubQ', 'TypeSafe']);
}

function validateOutputsWithoutAProviderDrawTheTypeSafeFill() {
  Object.assign(globalThis, { document: { createElementNS: createFakeNode } });
  const drawn: { svg?: FakeNode } = {};
  function replaceChildren(svg: FakeNode) {
    drawn.svg = svg;
  }
  const graphBlock = { block: {}, box: { clientHeight: 200, replaceChildren } } as unknown as GraphBlock;
  const answers: Answer[] = [{ type: 'noul', noul: 0.8 }];
  const oldVersion = { time: 't', state: {}, questions: {}, calls: 1, outputs: [{ answers: {}, usage: { input_tokens: 1, output_tokens: 1 } }] } as unknown as Version;
  renderChart(graphBlock, 'q', { type: 'noul' }, answers, null, listProviders(oldVersion));
  const bars = listByName(drawn.svg!.children as FakeNode[], 'rect');
  // expect(bars[0].attrs.fill).toBe('rgb(201, 112, 157)');
  expect(bars[0].attrs.fill).toBe('#009E73');
}

afterEach(removeFakeDocument);
test('test_chart_colors_each_call_bar_by_provider_and_draws_no_provider_letters', validateChartMarksEachCallBarWithItsProviderLetter);
test('test_outputs_without_a_provider_draw_the_typesafe_fill', validateOutputsWithoutAProviderDrawTheTypeSafeFill);
test('test_pinned_runs_draw_muted_bars_behind_and_widen_the_slot',validatePinnedRunsDrawMutedBarsBehindAndWidenTheSlot);
test('test_keys_sort_by_average_descending', validateKeysSortByAverageDescending);
test('test_noul_output_draws_one_bar_at_the_noul_value', validateNoulDrawsOneBarAtTheNoulValue);
test('test_noul_draws_an_axis_with_true_and_false_and_a_middle_baseline', validateNoulDrawsAnAxisWithTrueAndFalseAndAMiddleBaseline);
test('test_other_questions_still_draw_the_number_ticks', validateOtherQuestionsStillDrawTheNumberTicks);
test('test_average_adds_a_bar_and_a_range_line', validateAverageAddsABarAndRangeLine);
test('test_layout_holds_what_the_info_box_needs', validateLayoutHoldsWhatTheInfoBoxNeeds);
