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

function createFakeText(text: string) {
  const element = createFakeElement();
  element.textContent = text;
  return element;
}

function installFakeDocument() {
  Object.assign(globalThis, { document: { createElement: createFakeElement, createTextNode: createFakeText } });
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
  installFakeDocument();
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
  installFakeDocument();
  graphState.collapsedByName.q = true;
  const graphBlock = createGraphBlock(1, 'q', { type: 'noul' }, noop, version);
  const block = graphBlock.block as unknown as ReturnType<typeof createFakeElement>;
  expect(block.classes).toEqual(['collapsed']);
  expect(block.children.length).toBe(2);
  expect(block.children[1]).toBe(graphBlock.box);
  const titleRow = block.children[0] as ReturnType<typeof createFakeElement>;
  expect(titleRow.children.length).toBe(3);
}

function validateResultNotesButtonShowsOnlyForAVersionWithARun() {
  installFakeDocument();
  const withoutRun = createGraphBlock(1, 'q', { type: 'noul' }, noop, version);
  const withRun = createGraphBlock(1, 'q', { type: 'noul' }, noop, { ...version, outputs: [{}] as never });
  const emptyRow = (withoutRun.block as unknown as ReturnType<typeof createFakeElement>).children[0] as ReturnType<typeof createFakeElement>;
  const runRow = (withRun.block as unknown as ReturnType<typeof createFakeElement>).children[0] as ReturnType<typeof createFakeElement>;
  expect(emptyRow.children.length).toBe(3);
  expect(runRow.children.length).toBe(4);
  const button = runRow.children[2] as unknown as { id: string; textContent: string };
  expect(button.id).toBe('resultNotesButtonq');
  expect(button.textContent).toBe('notes');
}

function readTitleParts(isReferencesReplaced: boolean): FakeElement[] {
  installFakeDocument();
  graphState.isReferencesReplaced = isReferencesReplaced;
  const question = { type: 'noul', instructions: 'Does `message.text` ask?' } as const;
  const graphBlock = createGraphBlock(1, 'q', question, noop, { ...version, state: { message: { text: 'Hi.' } } });
  const block = graphBlock.block as unknown as FakeElement;
  const titleRow = block.children[0] as FakeElement;
  return (titleRow.children[1] as FakeElement).children as FakeElement[];
}

function readTitleText(isReferencesReplaced: boolean): string {
  let text = '';
  for (const part of readTitleParts(isReferencesReplaced))
    text += part.textContent;
  return text;
}

function validateTitleReferencesAreReplacedOnlyWhenTheToggleIsOn() {
  expect(readTitleText(false)).toBe('Q1 q · Does `message.text` ask?');
  expect(readTitleText(true)).toBe("Q1 q · Does 'Hi.' ask?");
}

function validateTitleReferenceShowsTheReplacedTextInATooltip() {
  const parts = readTitleParts(false);
  expect(parts.length).toBe(3);
  expect(parts[1].className).toBe('backtick-ref');
  expect(parts[1].textContent).toBe('`message.text`');
  expect(parts[1].title).toBe("'Hi.'");
}

type FakeElement = ReturnType<typeof createFakeElement>;

afterEach(removeFakeDocument);
test('test_title_reference_shows_the_replaced_text_in_a_tooltip', validateTitleReferenceShowsTheReplacedTextInATooltip);
test('test_title_references_are_replaced_only_when_the_toggle_is_on', validateTitleReferencesAreReplacedOnlyWhenTheToggleIsOn);
test('test_graph_title_holds_number_name_and_instructions', validateGraphTitleHoldsNumberNameAndInstructions);
test('test_collapse_button_shows_state_and_flips_it', validateCollapseButtonShowsStateAndFlipsIt);
test('test_block_holds_title_row_then_chart_box', validateBlockHoldsTitleRowThenChartBox);
test('test_result_notes_button_shows_only_for_a_version_with_a_run', validateResultNotesButtonShowsOnlyForAVersionWithARun);
