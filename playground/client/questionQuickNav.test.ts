import { test, expect, afterEach, mock, spyOn } from 'bun:test';
import { json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import type { StateEffectType, TransactionSpec } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import * as editors from './editors';
import { createQuestionQuickNav, findQuestionPosition, listQuestionNames, moveQuestionIntoView } from './questionQuickNav';

const SCROLL_EFFECT_TYPE = (EditorView.scrollIntoView(0) as unknown as { type: StateEffectType<unknown> }).type;

afterEach(removeFakeState);

function removeFakeState() {
  mock.restore();
  Reflect.deleteProperty(globalThis, 'document');
}

function createState(doc: string): EditorState {
  return EditorState.create({ doc: doc, extensions: [json()] });
}

function createFakeElement() {
  const element = {
    className: '', textContent: '', value: '', hidden: false,
    children: [] as unknown[], attrs: {} as Record<string, string>, listeners: {} as Record<string, () => void>,
    setAttribute(key: string, value: string) { element.attrs[key] = value; },
    addEventListener(type: string, listener: () => void) { element.listeners[type] = listener; },
    replaceChildren(...children: unknown[]) { element.children = children; },
  };
  return element;
}

type FakeElement = ReturnType<typeof createFakeElement>;

function installFakeDocument() {
  const errorLine = createFakeElement();
  function getElementById(id: string): FakeElement | null {
    if (id === 'errorLine')
      return errorLine;
    return null;
  }
  Object.assign(globalThis, { document: { createElement: createFakeElement, getElementById: getElementById } });
  return errorLine;
}

function installStubQuestionsEditor(doc: string) {
  const scrolledPositions: number[] = [];
  const view = { state: createState(doc), dispatch: saveDispatch };
  function saveDispatch(spec: TransactionSpec): void {
    for (const effect of view.state.update(spec).effects) {
      if (effect.is(SCROLL_EFFECT_TYPE))
        scrolledPositions.push((effect.value as { range: { from: number } }).range.from);
    }
  }
  spyOn(editors, 'getQuestionsEditor').mockReturnValue(view as unknown as EditorView);
  return { view: view, scrolledPositions: scrolledPositions };
}

function readOptionValues(select: FakeElement): string[] {
  const values: string[] = [];
  for (const option of select.children as FakeElement[])
    values.push(option.value);
  return values;
}

function validateListQuestionNamesReturnsOnlyTopLevelNames() {
  expect(listQuestionNames(createState('{"a": {"a": 1, "inner": 2}, "b": 3}'))).toEqual(['a', 'b']);
}

function validateListQuestionNamesIsEmptyWhenTheRootIsNotAnObject() {
  expect(listQuestionNames(createState('[{"a": 1}]'))).toEqual([]);
  expect(listQuestionNames(createState(''))).toEqual([]);
}

function validateFindQuestionPositionReturnsTheOffsetOfTheNamedProperty() {
  const doc = '{\n  "first": 1,\n  "second": 2\n}';
  const state = createState(doc);
  expect(findQuestionPosition(state, 'first')).toBe(doc.indexOf('"first"'));
  expect(findQuestionPosition(state, 'second')).toBe(doc.indexOf('"second"'));
}

function validateFindQuestionPositionIgnoresANestedKeyWithTheSameName() {
  const doc = '{"x": {"q": 1}, "q": 2}';
  const position = findQuestionPosition(createState(doc), 'q');
  expect(position).toBe(doc.indexOf('"q": 2'));
  expect(position).not.toBe(doc.indexOf('"q": 1'));
}

function validateFindQuestionPositionReturnsNullForAMissingNameOrANonObjectRoot() {
  expect(findQuestionPosition(createState('{"a": 1}'), 'missing')).toBeNull();
  expect(findQuestionPosition(createState('[1]'), 'a')).toBeNull();
}

function validateMoveQuestionIntoViewDispatchesOneScrollEffectAtTheQuestion() {
  const errorLine = installFakeDocument();
  const doc = '{"a": 1, "b": 2}';
  const stub = installStubQuestionsEditor(doc);
  moveQuestionIntoView('b');
  expect(stub.scrolledPositions).toEqual([doc.indexOf('"b"')]);
  expect(errorLine.textContent).toBe('');
}

function validateMoveQuestionIntoViewShowsAMessageAndDoesNotScrollForAMissingName() {
  const errorLine = installFakeDocument();
  const stub = installStubQuestionsEditor('{"a": 1}');
  moveQuestionIntoView('missing');
  expect(errorLine.textContent).toBe('question missing is not in the questions editor');
  expect(stub.scrolledPositions).toEqual([]);
}

function validateMoveToAPresentQuestionClearsOnlyTheMissingQuestionMessage() {
  const errorLine = installFakeDocument();
  installStubQuestionsEditor('{"a": 1}');
  moveQuestionIntoView('missing');
  expect(errorLine.textContent).toBe('question missing is not in the questions editor');
  moveQuestionIntoView('a');
  expect(errorLine.textContent).toBe('');
  errorLine.textContent = 'state is not valid JSON';
  moveQuestionIntoView('a');
  expect(errorLine.textContent).toBe('state is not valid JSON');
}

function validateChangeMovesToThePickedNameAndResetsTheSelect() {
  installFakeDocument();
  const doc = '{"a": 1, "b": 2}';
  const stub = installStubQuestionsEditor(doc);
  const select = createQuestionQuickNav() as unknown as FakeElement;
  expect(stub.scrolledPositions).toEqual([]);
  select.value = 'b';
  select.listeners.change();
  expect(stub.scrolledPositions).toEqual([doc.indexOf('"b"')]);
  expect(select.value).toBe('');
}

function validateMousedownRebuildsTheOptionsFromTheCurrentEditorText() {
  installFakeDocument();
  const stub = installStubQuestionsEditor('{"a": 1}');
  const select = createQuestionQuickNav() as unknown as FakeElement;
  expect(select.className).toBe('question-quick-nav');
  expect(readOptionValues(select)).toEqual(['', 'a']);
  const placeholder = select.children[0] as FakeElement;
  expect(placeholder.hidden).toBe(true);
  stub.view.state = createState('{"a": 1, "b": {"c": 2}, "d": 3}');
  select.listeners.mousedown();
  expect(readOptionValues(select)).toEqual(['', 'a', 'b', 'd']);
  stub.view.state = createState('{"z": 1}');
  select.listeners.focus();
  expect(readOptionValues(select)).toEqual(['', 'z']);
}

test('test_list_question_names_returns_only_top_level_names', validateListQuestionNamesReturnsOnlyTopLevelNames);
test('test_list_question_names_is_empty_when_the_root_is_not_an_object', validateListQuestionNamesIsEmptyWhenTheRootIsNotAnObject);
test('test_find_question_position_returns_the_offset_of_the_named_property', validateFindQuestionPositionReturnsTheOffsetOfTheNamedProperty);
test('test_find_question_position_ignores_a_nested_key_with_the_same_name', validateFindQuestionPositionIgnoresANestedKeyWithTheSameName);
test('test_find_question_position_returns_null_for_a_missing_name_or_a_non_object_root', validateFindQuestionPositionReturnsNullForAMissingNameOrANonObjectRoot);
test('test_move_question_into_view_shows_a_message_and_does_not_scroll_for_a_missing_name', validateMoveQuestionIntoViewShowsAMessageAndDoesNotScrollForAMissingName);
test('test_move_question_into_view_dispatches_one_scroll_effect_at_the_question', validateMoveQuestionIntoViewDispatchesOneScrollEffectAtTheQuestion);
test('test_move_to_a_present_question_clears_only_the_missing_question_message', validateMoveToAPresentQuestionClearsOnlyTheMissingQuestionMessage);
test('test_change_moves_to_the_picked_name_and_resets_the_select', validateChangeMovesToThePickedNameAndResetsTheSelect);
test('test_mousedown_rebuilds_the_options_from_the_current_editor_text', validateMousedownRebuildsTheOptionsFromTheCurrentEditorText);
