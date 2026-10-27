import { test, expect, afterEach } from 'bun:test';
import type { Version } from '../playgroundHistory';
import type { ChartLayout } from './graphTypes';
import { graphState } from './graphState';
import { EMPTY_MESSAGE, isRunDataPresent, renderGraphs } from './graphs';

class FakeElement {
  name = '';
  className = '';
  textContent = '';
  title = '';
  type = '';
  checked = false;
  clientHeight = 200;
  attrs: Record<string, string> = {};
  children: FakeElement[] = [];
  classes: string[] = [];
  listeners: Record<string, () => void> = {};
  classList = { add: (className: string) => this.classes.push(className) };
  setAttribute(key: string, value: string) { this.attrs[key] = value; }
  appendChild(child: FakeElement) { this.children.push(child); }
  replaceChildren(...children: FakeElement[]) { this.children = children; }
  addEventListener(type: string, listener: () => void) { this.listeners[type] = listener; }
}

function createFakeElementNamed(namespace: string, name: string) {
  const element = new FakeElement();
  element.name = name;
  return element;
}

function createFakeTag(tag: string) {
  return createFakeElementNamed('', tag);
}

function installFakeDocument() {
  Object.assign(globalThis, { document: { createElementNS: createFakeElementNamed, createElement: createFakeTag } });
}

function removeFakeDocument() {
  Reflect.deleteProperty(globalThis, 'document');
  graphState.collapsedByName = {};
  graphState.averageShownByName = {};
}

const usage = { input_tokens: 1, output_tokens: 1 };
const empty: Version = { id: 1, time: 'now', state: null, questions: {}, calls: 0, outputs: [] };
const filled: Version = { ...empty, calls: 1, outputs: [{ model: 'm', answers: { q: { type: 'noul', noul: 0.5 } }, usage }] };
const twoQuestions: Version = { ...filled, questions: { q: { type: 'noul', instructions: 'Is it?' }, other: { type: 'noul' } } };

function validateRunDataPresence() {
  expect(isRunDataPresent(empty, 'q')).toBe(false);
  expect(isRunDataPresent(filled, 'q')).toBe(true);
  expect(isRunDataPresent(filled, 'other')).toBe(false);
}

function validateEmptyMessageText() {
  expect(EMPTY_MESSAGE).toBe('Submit a run to generate a graph');
}

function validateBlocksChartsAndEmptyMessages() {
  installFakeDocument();
  const container = new FakeElement();
  const drawn: ChartLayout[][] = [];
  function recordCharts(charts: ChartLayout[]) {
    drawn.push(charts);
  }
  renderGraphs(twoQuestions, container as unknown as HTMLElement, recordCharts);
  expect(container.children.length).toBe(2);
  expect(drawn.length).toBe(1);
  expect(drawn[0].length).toBe(1);
  expect(drawn[0][0].name).toBe('q');
  expect(drawn[0][0].keys).toEqual(['yes']);
  const otherBox = container.children[1].children[1];
  expect(otherBox.textContent).toBe(EMPTY_MESSAGE);
  expect(otherBox.classes).toEqual(['empty']);
}

function validateCollapsedQuestionDrawsNoChart() {
  installFakeDocument();
  graphState.collapsedByName.q = true;
  const container = new FakeElement();
  const drawn: ChartLayout[][] = [];
  function recordCharts(charts: ChartLayout[]) {
    drawn.push(charts);
  }
  renderGraphs(twoQuestions, container as unknown as HTMLElement, recordCharts);
  expect(drawn[0].length).toBe(0);
  expect(container.children[0].classes).toEqual(['collapsed']);
}

function validateTogglingAverageRendersAgain() {
  installFakeDocument();
  const container = new FakeElement();
  const drawn: ChartLayout[][] = [];
  function recordCharts(charts: ChartLayout[]) {
    drawn.push(charts);
  }
  renderGraphs(twoQuestions, container as unknown as HTMLElement, recordCharts);
  const checkbox = container.children[0].children[0].children[2].children[0];
  checkbox.checked = true;
  checkbox.listeners.change();
  expect(drawn.length).toBe(2);
  expect(drawn[1][0].isAverageShown).toBe(true);
}

afterEach(removeFakeDocument);
test('test_run_data_is_present_only_with_an_output_for_the_name', validateRunDataPresence);
test('test_empty_message_text', validateEmptyMessageText);
test('test_render_graphs_draws_charts_and_empty_messages', validateBlocksChartsAndEmptyMessages);
test('test_collapsed_question_draws_no_chart', validateCollapsedQuestionDrawsNoChart);
test('test_toggling_average_renders_again', validateTogglingAverageRendersAgain);
