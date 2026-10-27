import { test, expect, afterEach } from 'bun:test';
import type { Version } from '../playgroundHistory';
import { graphState } from './graphState';
import { createCollapseButton, createGraphBlock, formatGraphTitle } from './graphBlock';

function createFakeElement() {
  const element = {
    className: '', textContent: '', title: '', type: '', checked: false,
    children: [] as unknown[], classes: [] as string[], attrs: {} as Record<string, string>, listeners: {} as Record<string, () => void>,
    classList: { add(name: string) { element.classes.push(name); } },
    setAttribute(key: string, value: string) { element.attrs[key] = value; },
    appendChild(child: unknown) { element.children.push(child); },
    addEventListener(type: string, listener: () => void) { element.listeners[type] = listener; },
  };
  return element;
}

function removeFakeDocument() {
  Reflect.deleteProperty(globalThis, 'document');
  graphState.collapsedByName = {};
  graphState.isReferencesReplaced = false;
}

const version: Version = { id: 1, time: 'now', state: {}, questions: {}, calls: 0, outputs: [] };

function noop() {}

function validateGraphTitleHoldsNumberNameAndInstructions() {
  const title = formatGraphTitle(2, 'needsTask', { type: 'noul', instructions: 'Is it?' });
  expect(title).toBe('Q2 needsTask · Is it?');
  expect(formatGraphTitle(1, 'n', { type: 'noul' })).toBe('Q1 n · (none)');
}

function validateCollapseButtonShowsStateAndFlipsIt() {
  Object.assign(globalThis, { document: { createElement: createFakeElement } });
  let renderCount = 0;
  function countRender() {
    renderCount++;
  }
  const button = createCollapseButton('q', countRender) as unknown as ReturnType<typeof createFakeElement>;
  expect(button.textContent).toBe('▼');
  button.listeners.click();
  expect(graphState.collapsedByName.q).toBe(true);
  expect(renderCount).toBe(1);
}

function validateBlockHoldsTitleRowThenChartBox() {
  Object.assign(globalThis, { document: { createElement: createFakeElement } });
  graphState.collapsedByName.q = true;
  const graphBlock = createGraphBlock(1, 'q', { type: 'noul' }, noop, version);
  const block = graphBlock.block as unknown as ReturnType<typeof createFakeElement>;
  expect(block.classes).toEqual(['collapsed']);
  expect(block.children.length).toBe(2);
  expect(block.children[1]).toBe(graphBlock.box);
  const titleRow = block.children[0] as ReturnType<typeof createFakeElement>;
  expect(titleRow.children.length).toBe(3);
}

function readTitleText(isReferencesReplaced: boolean): string {
  Object.assign(globalThis, { document: { createElement: createFakeElement } });
  graphState.isReferencesReplaced = isReferencesReplaced;
  const question = { type: 'noul', instructions: 'Does `message.text` ask?' } as const;
  const graphBlock = createGraphBlock(1, 'q', question, noop, { ...version, state: { message: { text: 'Hi.' } } });
  const block = graphBlock.block as unknown as ReturnType<typeof createFakeElement>;
  const titleRow = block.children[0] as ReturnType<typeof createFakeElement>;
  return (titleRow.children[1] as ReturnType<typeof createFakeElement>).textContent;
}

function validateTitleReferencesAreReplacedOnlyWhenTheToggleIsOn() {
  expect(readTitleText(false)).toBe('Q1 q · Does `message.text` ask?');
  expect(readTitleText(true)).toBe("Q1 q · Does 'Hi.' ask?");
}

afterEach(removeFakeDocument);
test('test_title_references_are_replaced_only_when_the_toggle_is_on', validateTitleReferencesAreReplacedOnlyWhenTheToggleIsOn);
test('test_graph_title_holds_number_name_and_instructions', validateGraphTitleHoldsNumberNameAndInstructions);
test('test_collapse_button_shows_state_and_flips_it', validateCollapseButtonShowsStateAndFlipsIt);
test('test_block_holds_title_row_then_chart_box', validateBlockHoldsTitleRowThenChartBox);
