import { test, expect, afterEach } from 'bun:test';
import { json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import { listBatchItems } from './backtickBatchItems';
import { pageState } from '../page/state';

afterEach(() => {
  pageState.isBatchOn = false;
});

function createJsonState(text: string): EditorState {
  return EditorState.create({ doc: text, extensions: [json()] });
}

function validateBatchOffListsNoItems() {
  pageState.isBatchOn = false;
  expect(listBatchItems([createJsonState('[{"a": 1}]')])).toBe(null);
}

function validateBatchOnListsTheArrayItems() {
  pageState.isBatchOn = true;
  expect(listBatchItems([createJsonState('[{"a": 1}, {"a": 2}]')])).toEqual([{ a: 1 }, { a: 2 }]);
}

function validateBatchOnListsNoItemsForBrokenJson() {
  pageState.isBatchOn = true;
  expect(listBatchItems([createJsonState('[{"a": 1}, ')])).toBe(null);
}

function validateBatchOnListsNoItemsForAnObject() {
  pageState.isBatchOn = true;
  expect(listBatchItems([createJsonState('{"a": 1}')])).toBe(null);
}

function validateBatchOnListsNoItemsForAnEmptyArray() {
  pageState.isBatchOn = true;
  expect(listBatchItems([createJsonState('[]')])).toBe(null);
}

test('test_batch_off_lists_no_items', validateBatchOffListsNoItems);
test('test_batch_on_lists_the_array_items', validateBatchOnListsTheArrayItems);
test('test_batch_on_lists_no_items_for_broken_json', validateBatchOnListsNoItemsForBrokenJson);
test('test_batch_on_lists_no_items_for_an_object', validateBatchOnListsNoItemsForAnObject);
test('test_batch_on_lists_no_items_for_an_empty_array', validateBatchOnListsNoItemsForAnEmptyArray);
