import { test, expect } from 'bun:test';
import { json, jsonLanguage } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { findEnclosingQuestionName, findQuestionsShapeErrors, findStateShapeErrors, findTopLevelObject, listTopLevelKeys, listTopLevelProperties, readPropertyName } from './questionNames';

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

function createJsonState(text: string): EditorState {
  return EditorState.create({ doc: text, extensions: [json()] });
}

function validateEnclosingQuestionNameIsTheTopLevelKeyAroundTheOffset() {
  // Step: two questions; the offset is deep inside the second one.
  const text = '{"first": {"a": "x"}, "second": {"b": {"c": "`y`"}}}';
  const offset = text.indexOf('`y`');
  // Step: the enclosing question is the top-level key that holds the offset.
  expect(findEnclosingQuestionName(createJsonState(text), offset)).toBe('second');
}

function validateEnclosingQuestionNameIsNullOutsideEveryQuestion() {
  // Step: the offset is on the opening brace, outside every property.
  expect(findEnclosingQuestionName(createJsonState('{"first": "x"}'), 0)).toBe(null);
  // Step: the document is not an object, so there are no questions.
  expect(findEnclosingQuestionName(createJsonState('["`x`"]'), 2)).toBe(null);
}

function createView(text: string): EditorView {
  return { state: createJsonState(text) } as unknown as EditorView;
}

function validateQuestionShapeErrorGoesOnTheQuestionKey() {
  // Step: question q has a type that TypeSafe does not know.
  const text = '{"q":{"type":"wrong"}}';
  // Step: the error goes on the key "q".
  expect(findQuestionsShapeErrors(createView(text))).toEqual([
    { from: 1, to: 4, severity: 'error', message: 'q.type must be noul, choice, score or box' },
  ]);
}

function validateQuestionsErrorWithoutAKeyGoesOnTheFirstCharacter() {
  // Step: the questions document is an array, so no question key matches the error.
  expect(findQuestionsShapeErrors(createView('[]'))).toEqual([
    { from: 0, to: 1, severity: 'error', message: 'questions must be an object' },
  ]);
}

function validateQuestionsShapeCheckSkipsInvalidJson() {
  // Step: the JSON parse linter already shows broken JSON, so the shape check adds nothing.
  expect(findQuestionsShapeErrors(createView('{"q":'))).toEqual([]);
}

function validateStateShapeErrorGoesOnTheFirstCharacter() {
  // Step: the state is a number, which TypeSafe does not accept.
  expect(findStateShapeErrors(createView('5'))).toEqual([
    { from: 0, to: 1, severity: 'error', message: 'state must be a string, object or array' },
  ]);
}

test('test_question_shape_error_goes_on_the_question_key', validateQuestionShapeErrorGoesOnTheQuestionKey);
test('test_questions_error_without_a_key_goes_on_the_first_character', validateQuestionsErrorWithoutAKeyGoesOnTheFirstCharacter);
test('test_questions_shape_check_skips_invalid_json', validateQuestionsShapeCheckSkipsInvalidJson);
test('test_state_shape_error_goes_on_the_first_character', validateStateShapeErrorGoesOnTheFirstCharacter);
test('test_enclosing_question_name_is_the_top_level_key_around_the_offset', validateEnclosingQuestionNameIsTheTopLevelKeyAroundTheOffset);
test('test_enclosing_question_name_is_null_outside_every_question', validateEnclosingQuestionNameIsNullOutsideEveryQuestion);
test('test_list_top_level_keys_skips_nested_names', validateListsOnlyTopLevelKeys);
test('test_empty_text_has_no_top_level_object', validateEmptyTextHasNoObject);
test('test_read_property_name_strips_quotes', validateReadsNameWithoutQuotes);
