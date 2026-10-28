import { test, expect } from 'bun:test';
import { json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { buildBacktickHoverSource } from './backtickHover';

function createJsonState(text: string): EditorState {
  return EditorState.create({ doc: text, extensions: [json()] });
}

const STATE_TEXT = '{"message": {"text": "Hello"}}';
const QUESTIONS_TEXT = 'Does `message.text` ask? Or `nope`? Plain words.';

function createSource() {
  return buildBacktickHoverSource(() => [createJsonState(STATE_TEXT), createJsonState(QUESTIONS_TEXT)]);
}

function createView(): EditorView {
  return { state: createJsonState(QUESTIONS_TEXT) } as unknown as EditorView;
}

function validateHoverInsideNameGivesTooltipOnTheName() {
  const nameFrom = QUESTIONS_TEXT.indexOf('message.text');
  const tooltip = createSource()(createView(), nameFrom + 3);
  expect(tooltip?.pos).toBe(nameFrom);
  expect(tooltip?.end).toBe(nameFrom + 'message.text'.length);
  expect(tooltip?.above).toBe(true);
}

function validateHoverOutsideBackticksGivesNull() {
  const plainFrom = QUESTIONS_TEXT.indexOf('Plain');
  expect(createSource()(createView(), plainFrom + 2)).toBe(null);
}

function validateHoverOnUndefinedNameGivesNull() {
  const nopeFrom = QUESTIONS_TEXT.indexOf('nope');
  expect(createSource()(createView(), nopeFrom + 1)).toBe(null);
}

function validateHoverOnArrayIndexNameGivesTooltipOnTheWholeName() {
  const questionsText = '{"q": "`userMessageArray[1]`"}';
  const source = buildBacktickHoverSource(() => [createJsonState('{"userMessageArray": ["a", "b"]}'), createJsonState(questionsText)]);
  const view = { state: createJsonState(questionsText) } as unknown as EditorView;
  const nameFrom = questionsText.indexOf('userMessageArray[1]');
  const tooltip = source(view, nameFrom + 3);
  expect(tooltip?.pos).toBe(nameFrom);
  expect(tooltip?.end).toBe(nameFrom + 'userMessageArray[1]'.length);
}

test('test_hover_on_array_index_name_gives_tooltip_on_the_whole_name', validateHoverOnArrayIndexNameGivesTooltipOnTheWholeName);
test('test_hover_inside_name_gives_tooltip_on_the_name', validateHoverInsideNameGivesTooltipOnTheName);
test('test_hover_outside_backticks_gives_null', validateHoverOutsideBackticksGivesNull);
test('test_hover_on_undefined_name_gives_null', validateHoverOnUndefinedNameGivesNull);
