import { test, expect, afterEach, mock, spyOn } from 'bun:test';
import { json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import type { TransactionSpec } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import type { Version } from '../playgroundHistory';
import * as editors from './editors';
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
  Object.assign(globalThis, { document: { createElement: createFakeElement, createTextNode: createFakeText, getElementById: createFakeElement } });
}

function removeFakeDocument() {
  mock.restore();
  Reflect.deleteProperty(globalThis, 'document');
  graphState.collapsedByName = {};
  graphState.isReferencesReplaced = false;
}

// const version: Version = { id: 1, time: 'now', state: {}, questions: {}, calls: 0, outputs: [] };
const version: Version = { time: 'now', state: {}, questions: {}, calls: 0, outputs: [] };

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

function readTitleParts(isReferencesReplaced: boolean, name = 'q'): FakeElement[] {
  installFakeDocument();
  graphState.isReferencesReplaced = isReferencesReplaced;
  const question = { type: 'noul', instructions: 'Does `message.text` ask?' } as const;
  const graphBlock = createGraphBlock(1, name, question, noop, { ...version, state: { message: { text: 'Hi.' } } });
  const block = graphBlock.block as unknown as FakeElement;
  const titleRow = block.children[0] as FakeElement;
  return (titleRow.children[1] as FakeElement).children as FakeElement[];
}

function readTitleText(isReferencesReplaced: boolean, name = 'q'): string {
  let text = '';
  for (const part of readTitleParts(isReferencesReplaced, name))
    text += part.textContent;
  return text;
}

function validateTitleReferencesAreReplacedOnlyWhenTheToggleIsOn() {
  expect(readTitleText(false)).toBe('Q1 q · Does `message.text` ask?');
  expect(readTitleText(true)).toBe("Q1 q · Does 'Hi.' ask?");
}

function validateReplacedReferencesKeepTheInstructionsWholeWhenTheNameHasAReference() {
  expect(readTitleText(true, 'a`message.text`b')).toBe("Q1 a`message.text`b · Does 'Hi.' ask?");
}

function validateTitleReferenceShowsTheReplacedTextInATooltip() {
  const parts = readTitleParts(false);
  expect(parts.length).toBe(4);
  expect(parts[2].className).toBe('backtick-ref');
  expect(parts[2].textContent).toBe('`message.text`');
  expect(parts[2].title).toBe('');
  expect(typeof parts[2].listeners.mouseenter).toBe('function');
  expect(typeof parts[2].listeners.mouseleave).toBe('function');
}

function validateTitleLinkMovesTheQuestionsEditorToTheGraphsQuestion() {
  const parts = readTitleParts(false);
  expect(parts[0].className).toBe('graph-question-link');
  expect(parts[0].textContent).toBe('Q1 q');
  const doc = '{\n  "p": {},\n  "q": {}\n}';
  const state = EditorState.create({ doc: doc, extensions: [json()] });
  const dispatchedEffects: { from: number; y: string }[] = [];
  function saveDispatch(spec: TransactionSpec): void {
    for (const effect of state.update(spec).effects) {
      const target = effect.value as { range: { from: number }; y: string };
      dispatchedEffects.push({ from: target.range.from, y: target.y });
    }
  }
  const stubView = { state: state, dispatch: saveDispatch };
  spyOn(editors, 'getQuestionsEditor').mockReturnValue(stubView as unknown as EditorView);
  parts[0].listeners.click();
  expect(dispatchedEffects).toEqual([{ from: doc.indexOf('"q"'), y: 'start' }]);
}

type FakeElement = ReturnType<typeof createFakeElement>;

afterEach(removeFakeDocument);
test('test_title_link_moves_the_questions_editor_to_the_graphs_question', validateTitleLinkMovesTheQuestionsEditorToTheGraphsQuestion);
test('test_replaced_references_keep_the_instructions_whole_when_the_name_has_a_reference', validateReplacedReferencesKeepTheInstructionsWholeWhenTheNameHasAReference);
test('test_title_reference_shows_the_replaced_text_in_a_tooltip', validateTitleReferenceShowsTheReplacedTextInATooltip);
test('test_title_references_are_replaced_only_when_the_toggle_is_on', validateTitleReferencesAreReplacedOnlyWhenTheToggleIsOn);
test('test_graph_title_holds_number_name_and_instructions', validateGraphTitleHoldsNumberNameAndInstructions);
test('test_collapse_button_shows_state_and_flips_it', validateCollapseButtonShowsStateAndFlipsIt);
test('test_block_holds_title_row_then_chart_box', validateBlockHoldsTitleRowThenChartBox);
test('test_result_notes_button_shows_only_for_a_version_with_a_run', validateResultNotesButtonShowsOnlyForAVersionWithARun);
