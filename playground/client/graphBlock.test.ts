import { test, expect, afterEach } from 'bun:test';
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
}

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
  const graphBlock = createGraphBlock(1, 'q', { type: 'noul' }, noop);
  const block = graphBlock.block as unknown as ReturnType<typeof createFakeElement>;
  expect(block.classes).toEqual(['collapsed']);
  expect(block.children.length).toBe(2);
  expect(block.children[1]).toBe(graphBlock.box);
  const titleRow = block.children[0] as ReturnType<typeof createFakeElement>;
  expect(titleRow.children.length).toBe(3);
}

afterEach(removeFakeDocument);
test('test_graph_title_holds_number_name_and_instructions', validateGraphTitleHoldsNumberNameAndInstructions);
test('test_collapse_button_shows_state_and_flips_it', validateCollapseButtonShowsStateAndFlipsIt);
test('test_block_holds_title_row_then_chart_box', validateBlockHoldsTitleRowThenChartBox);
