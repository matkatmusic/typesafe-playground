import { test, expect } from 'bun:test';
import { CompletionContext } from '@codemirror/autocomplete';
import type { CompletionResult } from '@codemirror/autocomplete';
import { json } from '@codemirror/lang-json';
import { basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
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

test('test_options_insert_name_then_backtick', validateOptionsInsertNameThenBacktick);
test('test_backtick_lists_first_editor_names_first_without_duplicates', validateBacktickListsFirstEditorNamesFirstWithoutDuplicates);
test('test_no_list_without_a_backtick', validateNoListWithoutBacktick);
test('test_states_are_read_when_typing', validateStatesAreReadWhenTyping);
test('test_no_list_while_read_only', validateNoListWhileReadOnly);
test('test_extension_builds_before_editors_exist', validateExtensionBuildsBeforeEditorsExist);
