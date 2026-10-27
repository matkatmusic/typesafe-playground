import { test, expect } from 'bun:test';
import { jsonLanguage, json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import { collectAllObjects, collectNamedObjectValues, collectPropertyNames, listChildNames, listEditorChildNames, listEditorNames, mergeNames } from './propertyNames';

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

test('test_collect_names_reads_every_depth_once',validateCollectsDistinctNamesAtAnyDepth);
test('test_collect_names_works_on_broken_json', validateCollectsNamesFromBrokenJson);
test('test_collect_names_skips_empty_names', validateSkipsEmptyNames);
test('test_merge_names_keeps_each_name_once', validateMergeKeepsEachNameOnce);
test('test_list_editor_names_reads_syntax_tree', validateListsNamesFromEditorState);
test('test_list_child_names_follows_the_key_path', validateListsChildNamesByPath);
test('test_child_names_work_on_broken_json', validateChildNamesWorkOnBrokenJson);
test('test_list_editor_child_names_reads_syntax_tree', validateListsChildNamesFromEditorState);
test('test_collect_objects_and_named_object_values', validateCollectsEveryObjectAndNamedObjectValues);
