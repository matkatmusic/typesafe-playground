import { test, expect } from 'bun:test';
import { jsonLanguage, json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import { collectPropertyNames, listEditorNames, mergeNames } from './propertyNames';

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

test('test_collect_names_reads_every_depth_once', validateCollectsDistinctNamesAtAnyDepth);
test('test_collect_names_works_on_broken_json', validateCollectsNamesFromBrokenJson);
test('test_collect_names_skips_empty_names', validateSkipsEmptyNames);
test('test_merge_names_keeps_each_name_once', validateMergeKeepsEachNameOnce);
test('test_list_editor_names_reads_syntax_tree', validateListsNamesFromEditorState);
