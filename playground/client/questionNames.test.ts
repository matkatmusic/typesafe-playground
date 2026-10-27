import { test, expect } from 'bun:test';
import { jsonLanguage } from '@codemirror/lang-json';
import { findTopLevelObject, listTopLevelKeys, listTopLevelProperties, readPropertyName } from './questionNames';

function validateListsOnlyTopLevelKeys() {
  const text = '{"a": {"b": 1}, "c": 2}';
  const object = findTopLevelObject(jsonLanguage.parser.parse(text));
  if (object === null)
    throw new Error('no object');
  expect(listTopLevelKeys(object, text)).toEqual(['a', 'c']);
}

function validateEmptyTextHasNoObject() {
  expect(findTopLevelObject(jsonLanguage.parser.parse(''))).toBe(null);
}

function validateReadsNameWithoutQuotes() {
  const text = '{"abc": 1}';
  const object = findTopLevelObject(jsonLanguage.parser.parse(text));
  if (object === null)
    throw new Error('no object');
  const nameNode = listTopLevelProperties(object)[0].firstChild;
  if (nameNode === null)
    throw new Error('no name node');
  expect(readPropertyName(text, nameNode)).toBe('abc');
}

test('test_list_top_level_keys_skips_nested_names', validateListsOnlyTopLevelKeys);
test('test_empty_text_has_no_top_level_object', validateEmptyTextHasNoObject);
test('test_read_property_name_strips_quotes', validateReadsNameWithoutQuotes);
