import { test, expect } from 'bun:test';
import { acceptCompletion, CompletionContext } from '@codemirror/autocomplete';
import type { CompletionResult } from '@codemirror/autocomplete';
import { indentWithTab } from '@codemirror/commands';
import { json } from '@codemirror/lang-json';
import { basicSetup } from 'codemirror';
import { EditorState, Prec } from '@codemirror/state';
import { keymap, type EditorView } from '@codemirror/view';
import { buildBacktickSource, buildNameOptions, createBacktickKeyNames, listBothEditorStates } from './backtickCompletion';

function validateOptionsInsertNameThenBacktick() {
  const options = buildNameOptions(['mood']);
  expect(options[0].label).toBe('mood');
  expect(options[0].apply).toBe('mood`');
}

function createJsonState(text: string): EditorState {
  return EditorState.create({ doc: text, extensions: [json()] });
}

function createContext(typedText: string): CompletionContext {
  return new CompletionContext(createJsonState(typedText), typedText.length, false);
}

function listLabels(result: CompletionResult | null): string[] {
  if (result === null)
    throw new Error('no result');
  const labels: string[] = [];
  for (let i = 0; i < result.options.length; i++)
    labels.push(result.options[i].label);
  return labels;
}

function validateBacktickListsFirstEditorNamesFirstWithoutDuplicates() {
  const states = [createJsonState('{"mood": 1, "a": 2}'), createJsonState('{"q": {"mood": 1, "b": 2}}')];
  const source = buildBacktickSource(() => states);
  const result = source(createContext('`')) as CompletionResult | null;
  expect(listLabels(result)).toEqual(['mood', 'a', 'q', 'b']);
  expect(result?.from).toBe(1);
}

function validateNoListWithoutBacktick() {
  const source = buildBacktickSource(() => [createJsonState('{"a": 1}')]);
  expect(source(createContext('x'))).toBe(null);
  expect(source(createContext(''))).toBe(null);
}

function validateStatesAreReadWhenTyping() {
  const states = [createJsonState('{}')];
  const source = buildBacktickSource(() => states);
  states[0] = createJsonState('{"late": 1}');
  expect(listLabels(source(createContext('`')) as CompletionResult | null)).toEqual(['late']);
}

const NESTED_STATE_TEXT = '{"message": {"text": 1, "x": {"deep": 2}}, "other": 3}';

function validateDotListsChildKeysOfTheKey() {
  const source = buildBacktickSource(() => [createJsonState(NESTED_STATE_TEXT)]);
  const result = source(createContext('`message.')) as CompletionResult | null;
  expect(listLabels(result)).toEqual(['text', 'x']);
  expect(result?.from).toBe(9);
  expect(result?.options[0].apply).toBe('text`');
}

function validateDotListsChildKeysAtAnyDepth() {
  const source = buildBacktickSource(() => [createJsonState(NESTED_STATE_TEXT)]);
  expect(listLabels(source(createContext('`message.x.')) as CompletionResult | null)).toEqual(['deep']);
}

function validateDotListsNothingWithoutObjectChildren() {
  const source = buildBacktickSource(() => [createJsonState(NESTED_STATE_TEXT)]);
  expect(source(createContext('`other.'))).toBe(null);
  expect(source(createContext('`message.text.'))).toBe(null);
  expect(source(createContext('`missing.'))).toBe(null);
}

function validateDotOutsideABacktickKeyListsNothing() {
  const source = buildBacktickSource(() => [createJsonState(NESTED_STATE_TEXT)]);
  expect(source(createContext('message.'))).toBe(null);
  expect(source(createContext('`message `.'))).toBe(null);
  expect(source(createContext('`.'))).toBe(null);
  expect(source(createContext('`message..'))).toBe(null);
}

function validateNoListWhileReadOnly() {
  const lockedState = EditorState.create({ doc: '`', extensions: [json(), EditorState.readOnly.of(true)] });
  const lockedContext = new CompletionContext(lockedState, 1, false);
  const source = buildBacktickSource(() => [createJsonState('{"a": 1}')]);
  expect(source(lockedContext)).toBe(null);
}

function validateExtensionBuildsBeforeEditorsExist() {
  const extension = createBacktickKeyNames();
  const state = EditorState.create({ doc: '', extensions: [basicSetup, extension] });
  expect(state.doc.length).toBe(0);
  expect(() => listBothEditorStates()).toThrow('state editor is not created yet');
}

function validateTabAcceptsTheCompletionBeforeIndentAndPlaceholderTab() {
  const placeholderTab = keymap.of([{ key: 'Tab', run: () => true }]);
  const extensions = [basicSetup, keymap.of([indentWithTab]), Prec.high(placeholderTab), createBacktickKeyNames()];
  const state = EditorState.create({ doc: '', extensions: extensions });
  const tabBindings = [];
  for (const bindingList of state.facet(keymap))
    for (const binding of bindingList)
      if (binding.key === 'Tab')
        tabBindings.push(binding);
  expect(tabBindings.length).toBeGreaterThan(2);
  expect(tabBindings[0].run).toBe(acceptCompletion);
  expect(acceptCompletion({ state } as EditorView)).toBe(false);
}

test('test_tab_accepts_the_completion_before_indent_and_placeholder_tab', validateTabAcceptsTheCompletionBeforeIndentAndPlaceholderTab);
test('test_options_insert_name_then_backtick', validateOptionsInsertNameThenBacktick);
test('test_backtick_lists_first_editor_names_first_without_duplicates', validateBacktickListsFirstEditorNamesFirstWithoutDuplicates);
test('test_no_list_without_a_backtick', validateNoListWithoutBacktick);
test('test_states_are_read_when_typing', validateStatesAreReadWhenTyping);
test('test_dot_lists_child_keys_of_the_key', validateDotListsChildKeysOfTheKey);
test('test_dot_lists_child_keys_at_any_depth', validateDotListsChildKeysAtAnyDepth);
test('test_dot_lists_nothing_without_object_children', validateDotListsNothingWithoutObjectChildren);
test('test_dot_outside_a_backtick_key_lists_nothing', validateDotOutsideABacktickKeyListsNothing);
test('test_no_list_while_read_only', validateNoListWhileReadOnly);
test('test_extension_builds_before_editors_exist', validateExtensionBuildsBeforeEditorsExist);
