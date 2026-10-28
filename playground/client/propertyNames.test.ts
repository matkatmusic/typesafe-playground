import { test, expect } from 'bun:test';
import { jsonLanguage, json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import { collectAllObjects, collectNamedObjectValues, collectPropertyNames, findEditorValueText, findValueText, listChildNames, listEditorChildNames, listEditorNames, mergeNames, splitKeyPath } from './propertyNames';

function validateCollectsDistinctNamesAtAnyDepth() {
  const text = '{"a": {"b": 1, "a": 2}, "c": [{"d": 1}]}';
  const tree = jsonLanguage.parser.parse(text);
  expect(collectPropertyNames(tree, text)).toEqual(['a', 'b', 'c', 'd']);
}

function validateCollectsNamesFromBrokenJson() {
  const text = '{"a": 1, "b": ';
  const tree = jsonLanguage.parser.parse(text);
  expect(collectPropertyNames(tree, text)).toEqual(['a', 'b']);
}

function validateSkipsEmptyNames() {
  const text = '{"": 1, "a": 2}';
  const tree = jsonLanguage.parser.parse(text);
  expect(collectPropertyNames(tree, text)).toEqual(['a']);
}

function validateMergeKeepsEachNameOnce() {
  expect(mergeNames(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c']);
}

function validateListsNamesFromEditorState() {
  const state = EditorState.create({ doc: '{"a": {"b": 1}}', extensions: [json()] });
  expect(listEditorNames(state)).toEqual(['a', 'b']);
}

function validateListsChildNamesByPath() {
  const text = '{"a": {"b": {"c": 1, "d": {}}, "e": 2}, "z": {"a": {"f": 1}}}';
  const tree = jsonLanguage.parser.parse(text);
  expect(listChildNames(tree, text, ['a'])).toEqual(['b', 'e', 'f']);
  expect(listChildNames(tree, text, ['a', 'b'])).toEqual(['c', 'd']);
  expect(listChildNames(tree, text, ['a', 'b', 'd'])).toEqual([]);
  expect(listChildNames(tree, text, ['b', 'c'])).toEqual([]);
  expect(listChildNames(tree, text, ['e'])).toEqual([]);
  expect(listChildNames(tree, text, ['missing'])).toEqual([]);
}

function validateChildNamesWorkOnBrokenJson() {
  const text = '{"a": {"b": 1, "c": ';
  const tree = jsonLanguage.parser.parse(text);
  expect(listChildNames(tree, text, ['a'])).toEqual(['b', 'c']);
}

function validateListsChildNamesFromEditorState() {
  const state = EditorState.create({ doc: '{"a": {"b": 1}}', extensions: [json()] });
  expect(listEditorChildNames(state, ['a'])).toEqual(['b']);
}

function validateCollectsEveryObjectAndNamedObjectValues() {
  const text = '{"a": {"b": {}}, "c": [{"a": {}}]}';
  const tree = jsonLanguage.parser.parse(text);
  const objects = collectAllObjects(tree);
  expect(objects.length).toBe(5);
  expect(collectNamedObjectValues(objects, text, 'a').length).toBe(2);
}

function validateFindsStringAndObjectValueText() {
  const text = '{"message": {"text": "hi", "x": {"deep": 2}}}';
  const tree = jsonLanguage.parser.parse(text);
  expect(findValueText(tree, text, ['message', 'text'])).toBe('"hi"');
  expect(findValueText(tree, text, ['message', 'x'])).toBe('{"deep": 2}');
  expect(findValueText(tree, text, ['message', 'x', 'deep'])).toBe('2');
}

function validateFindValueTextIsNullWhenMissing() {
  const text = '{"message": {"text": "hi"}}';
  const tree = jsonLanguage.parser.parse(text);
  expect(findValueText(tree, text, ['message', 'nope'])).toBe(null);
  expect(findValueText(tree, text, ['nope', 'text'])).toBe(null);
  expect(findValueText(tree, text, ['nope'])).toBe(null);
}

function validateFindsValueTextFromEditorState() {
  const state = EditorState.create({ doc: '{"a": {"b": 1}}', extensions: [json()] });
  expect(findEditorValueText(state, ['a', 'b'])).toBe('1');
}

function validateSplitKeyPathKeepsIndexSteps() {
  expect(splitKeyPath('a.b[0][1].c')).toEqual(['a', 'b', '[0]', '[1]', 'c']);
  expect(splitKeyPath('a')).toEqual(['a']);
  expect(splitKeyPath('.')).toEqual([]);
}

function validateFindsValueTextInsideArrays() {
  const text = '{"a": ["x", "y"], "b": [{"c": 1}, {"c": 2}], "o": {"0": "zero"}}';
  const tree = jsonLanguage.parser.parse(text);
  expect(findValueText(tree, text, splitKeyPath('a[1]'))).toBe('"y"');
  expect(findValueText(tree, text, splitKeyPath('b[1].c'))).toBe('2');
  expect(findValueText(tree, text, splitKeyPath('a[2]'))).toBe(null);
  expect(findValueText(tree, text, splitKeyPath('o[0]'))).toBe(null);
  expect(findValueText(tree, text, splitKeyPath('o.0'))).toBe('"zero"');
  expect(findValueText(tree, text, splitKeyPath('a.0'))).toBe(null);
}

test('test_split_key_path_keeps_index_steps', validateSplitKeyPathKeepsIndexSteps);
test('test_find_value_text_steps_into_arrays', validateFindsValueTextInsideArrays);
test('test_find_value_text_reads_string_and_object_values', validateFindsStringAndObjectValueText);
test('test_find_value_text_is_null_when_missing', validateFindValueTextIsNullWhenMissing);
test('test_find_editor_value_text_reads_syntax_tree', validateFindsValueTextFromEditorState);
test('test_collect_names_reads_every_depth_once',validateCollectsDistinctNamesAtAnyDepth);
test('test_collect_names_works_on_broken_json', validateCollectsNamesFromBrokenJson);
test('test_collect_names_skips_empty_names', validateSkipsEmptyNames);
test('test_merge_names_keeps_each_name_once', validateMergeKeepsEachNameOnce);
test('test_list_editor_names_reads_syntax_tree', validateListsNamesFromEditorState);
test('test_list_child_names_follows_the_key_path', validateListsChildNamesByPath);
test('test_child_names_work_on_broken_json', validateChildNamesWorkOnBrokenJson);
test('test_list_editor_child_names_reads_syntax_tree', validateListsChildNamesFromEditorState);
test('test_collect_objects_and_named_object_values', validateCollectsEveryObjectAndNamedObjectValues);
