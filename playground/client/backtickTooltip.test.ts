import { test, expect, afterEach } from 'bun:test';
import { json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { pageState } from './state';
import { IS_QUESTIONS_EDITOR } from './questionNames';
import { appendReferenceText, buildBacktickHoverSource, findReferenceTooltipText } from './backtickTooltip';

interface FakeNode {
  className: string;
  textContent: string;
  title: string;
  style: Record<string, string>;
  listeners: Record<string, () => void>;
  addEventListener(type: string, listener: () => void): void;
  getBoundingClientRect(): { left: number; bottom: number };
  remove(): void;
}

const bodyChildren: FakeNode[] = [];

function createFakeNode(): FakeNode {
  const node: FakeNode = {
    className: '', textContent: '', title: '', style: {}, listeners: {},
    addEventListener(type, listener) { node.listeners[type] = listener; },
    getBoundingClientRect() { return { left: 10, bottom: 20 }; },
    remove() { bodyChildren.splice(bodyChildren.indexOf(node), 1); },
  };
  return node;
}

function createFakeText(text: string): FakeNode {
  return Object.assign(createFakeNode(), { textContent: text });
}

function installFakeDocument() {
  bodyChildren.length = 0;
  const body = { appendChild: (child: FakeNode) => bodyChildren.push(child) };
  Object.assign(globalThis, { document: { createElement: createFakeNode, createTextNode: createFakeText, body } });
}

function removeFakeDocument() {
  Reflect.deleteProperty(globalThis, 'document');
}

function runAppendReferenceText(text: string, textState: unknown, textQuestions: unknown): FakeNode[] {
  installFakeDocument();
  const nodes: FakeNode[] = [];
  appendReferenceText({ appendChild: (child: FakeNode) => nodes.push(child) } as unknown as HTMLElement, text, textState, textQuestions);
  return nodes;
}

function createJsonState(text: string): EditorState {
  return EditorState.create({ doc: text, extensions: [json()] });
}

const STATE_TEXT = '{"message": {"text": "Hello"}}';
const QUESTIONS_TEXT = '{"q": "Does `message.text` ask? Or `nope`? Plain words. `list[1]`"}';

function createSource(stateText: string, questionsText: string) {
  return buildBacktickHoverSource(() => [createJsonState(stateText), createJsonState(questionsText)]);
}

function createView(text: string): EditorView {
  return { state: createJsonState(text) } as unknown as EditorView;
}

function validateStateWinsOverQuestions() {
  expect(findReferenceTooltipText('a', { a: 'state' }, { a: 'questions' })).toBe("'state'");
  expect(findReferenceTooltipText('b', { a: 'state' }, { b: 'questions' })).toBe("'questions'");
  expect(findReferenceTooltipText('a[1]', { a: ['p', 'q'] }, {})).toBe("'q'");
  expect(findReferenceTooltipText('nope', { a: 1 }, { b: 2 })).toBe(null);
}

function validateHoverInsideNameGivesTooltipOnTheName() {
  installFakeDocument();
  const nameFrom = QUESTIONS_TEXT.indexOf('message.text');
  const tooltip = createSource(STATE_TEXT, QUESTIONS_TEXT)(createView(QUESTIONS_TEXT), nameFrom + 3);
  expect(tooltip?.pos).toBe(nameFrom);
  expect(tooltip?.end).toBe(nameFrom + 'message.text'.length);
  expect(tooltip?.above).toBe(true);
  const dom = tooltip?.create({} as EditorView).dom as unknown as FakeNode;
  expect(dom.className).toBe('backtick-tooltip');
  expect(dom.textContent).toBe("'Hello'");
}

function validateHoverOutsideBackticksGivesNull() {
  expect(createSource(STATE_TEXT, QUESTIONS_TEXT)(createView(QUESTIONS_TEXT), QUESTIONS_TEXT.indexOf('Plain') + 2)).toBe(null);
}

function validateHoverOnUnknownNameGivesNull() {
  expect(createSource(STATE_TEXT, QUESTIONS_TEXT)(createView(QUESTIONS_TEXT), QUESTIONS_TEXT.indexOf('nope') + 1)).toBe(null);
}


function validateHoverGivesNullWhenAnEditorHasInvalidJson() {
  const nameFrom = QUESTIONS_TEXT.indexOf('message.text');
  expect(createSource('{"message": ', QUESTIONS_TEXT)(createView(QUESTIONS_TEXT), nameFrom + 3)).toBe(null);
  expect(createSource(STATE_TEXT, 'Does `message.text` ask?')(createView('Does `message.text` ask?'), 10)).toBe(null);
}

function validateHoverOnArrayIndexNameGivesTooltipOnTheWholeName() {
  const questionsText = '{"q": "`userMessageArray[1]`"}';
  const source = createSource('{"userMessageArray": ["a", "b"]}', questionsText);
  const nameFrom = questionsText.indexOf('userMessageArray[1]');
  const tooltip = source(createView(questionsText), nameFrom + 3);
  expect(tooltip?.pos).toBe(nameFrom);
  expect(tooltip?.end).toBe(nameFrom + 'userMessageArray[1]'.length);
}

function validateBatchOnHoverShowsTheFixedTextForFoundAndUnknownNames() {
  installFakeDocument();
  pageState.isBatchOn = true;
  const foundFrom = QUESTIONS_TEXT.indexOf('message.text');
  const unknownFrom = QUESTIONS_TEXT.indexOf('nope');
  const source = createSource('[{"message": {"text": "Hello"}}]', QUESTIONS_TEXT);
  for (const from of [foundFrom, unknownFrom]) {
    const tooltip = source(createView(QUESTIONS_TEXT), from + 1);
    const dom = tooltip?.create({} as EditorView).dom as unknown as FakeNode;
    expect(dom.textContent).toBe('hover text replacement not active in batch mode');
    expect(tooltip?.pos).toBe(from);
  }
  expect(source(createView(QUESTIONS_TEXT), QUESTIONS_TEXT.indexOf('Plain') + 2)).toBe(null);
}

function validateBatchOnLeavesTheSavedVersionTooltipsAlone() {
  pageState.isBatchOn = true;
  const nodes = runAppendReferenceText('`count`', { count: 3 }, {});
  nodes[1].listeners.mouseenter();
  expect(bodyChildren[0].textContent).toBe("'3'");
}

function validateFoundReferenceBecomesASpanWithoutATitle() {
  const nodes = runAppendReferenceText('`count`', { count: 3 }, {});
  expect(nodes[1].className).toBe('backtick-ref');
  expect([nodes[1].textContent, nodes[1].title]).toEqual(['`count`', '']);
}

function validateMissingReferenceStaysPlainText() {
  expect(runAppendReferenceText('a `nope` b', {}, {}).length).toBe(1);
}
function validateMixedTextKeepsItsOrder() {
  const nodes = runAppendReferenceText('x `a` y `missing` z `b`', { a: 'one' }, { b: 'two' });
  expect(nodes[0].textContent).toBe('x ');
  expect(nodes[2].textContent).toBe(' y `missing` z ');
  expect(nodes[3].textContent).toBe('`b`');
  expect(nodes.length).toBe(5);
}

function validateMouseEnterAddsOneTooltipAndMouseLeaveRemovesIt() {
  const nodes = runAppendReferenceText('`a` `b`', { a: 'one', b: 'two' }, {});
  nodes[1].listeners.mouseenter();
  expect(bodyChildren.length).toBe(1);
  expect(bodyChildren[0].className).toBe('backtick-tooltip');
  expect(bodyChildren[0].textContent).toBe("'one'");
  expect(bodyChildren[0].style).toEqual({ position: 'fixed', left: '10px', top: '20px' });
  nodes[3].listeners.mouseenter();
  expect(bodyChildren.length).toBe(1);
  expect(bodyChildren[0].textContent).toBe("'two'");
  nodes[3].listeners.mouseleave();
  expect(bodyChildren.length).toBe(0);
}

const SCOPE_QUESTIONS = '{"ownName":{"type":"noul","instructions":{"task":"Is `secretWord` the word banana?","secretWord":"banana"}},"crossName":{"type":"noul","instructions":"Is `secretWord` the word banana?"},"stateName":{"type":"noul","instructions":"Is `fruit` the word apple?"}}';

function createQuestionsState(text: string): EditorState {
  return EditorState.create({ doc: text, extensions: [json(), IS_QUESTIONS_EDITOR.of(true)] });
}

function hoverInQuestionsEditor(pos: number) {
  const questionsState = createQuestionsState(SCOPE_QUESTIONS);
  const source = buildBacktickHoverSource(() => [createJsonState('{"fruit": "apple"}'), questionsState]);
  return source({ state: questionsState } as unknown as EditorView, pos);
}

function validateHoverInOwnNameShowsItsOwnValue() {
  installFakeDocument();
  // Step: hover secretWord inside ownName, which declares it.
  const tooltip = hoverInQuestionsEditor(SCOPE_QUESTIONS.indexOf('`secretWord`') + 2);
  // Step: the tooltip shows ownName's value.
  const dom = tooltip?.create({} as EditorView).dom as unknown as FakeNode;
  expect(dom.textContent).toBe("'banana'");
}

function validateHoverInCrossNameShowsNothing() {
  // Step: hover secretWord inside crossName, which does not declare it.
  const pos = SCOPE_QUESTIONS.indexOf('`secretWord`', SCOPE_QUESTIONS.indexOf('"crossName"')) + 2;
  // Step: another question's value is not shown.
  expect(hoverInQuestionsEditor(pos)).toBe(null);
}

test('test_hover_in_own_name_shows_its_own_value', validateHoverInOwnNameShowsItsOwnValue);
test('test_hover_in_cross_name_shows_nothing', validateHoverInCrossNameShowsNothing);

afterEach(removeFakeDocument);
afterEach(() => {
  pageState.isBatchOn = false;
});
test('test_batch_on_hover_shows_the_fixed_text_for_found_and_unknown_names', validateBatchOnHoverShowsTheFixedTextForFoundAndUnknownNames);
test('test_batch_on_leaves_the_saved_version_tooltips_alone', validateBatchOnLeavesTheSavedVersionTooltipsAlone);
test('test_state_wins_over_questions_and_array_index_and_unknown_name', validateStateWinsOverQuestions);
test('test_hover_inside_name_gives_tooltip_on_the_name', validateHoverInsideNameGivesTooltipOnTheName);
test('test_hover_outside_backticks_gives_null', validateHoverOutsideBackticksGivesNull);
test('test_hover_on_unknown_name_gives_null', validateHoverOnUnknownNameGivesNull);
test('test_hover_gives_null_when_an_editor_has_invalid_json', validateHoverGivesNullWhenAnEditorHasInvalidJson);
test('test_hover_on_array_index_name_gives_tooltip_on_the_whole_name', validateHoverOnArrayIndexNameGivesTooltipOnTheWholeName);
test('test_found_reference_becomes_a_span_without_a_title', validateFoundReferenceBecomesASpanWithoutATitle);
test('test_missing_reference_stays_plain_text', validateMissingReferenceStaysPlainText);
test('test_mixed_text_keeps_its_order', validateMixedTextKeepsItsOrder);
test('test_mouse_enter_adds_one_tooltip_and_mouse_leave_removes_it', validateMouseEnterAddsOneTooltipAndMouseLeaveRemovesIt);
