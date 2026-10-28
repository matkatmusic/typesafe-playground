import { test, expect } from 'bun:test';
import { findPathValue, formatReferenceValue, replaceReferences } from './references';

// appendReferenceText moved to backtickTooltip.ts; its tests are in backtickTooltip.test.ts

const state = { message: { text: 'Please send me the report by Friday.', tags: ['a', { deep: 7 }] }, count: 3, empty: null };

function validatePathLookupWalksObjectKeysAndArrayIndexes() {
  expect(findPathValue(state, 'message.text')).toEqual({ isFound: true, value: 'Please send me the report by Friday.' });
  // expect(findPathValue(state, 'message.tags.0')).toEqual({ isFound: true, value: 'a' });
  // expect(findPathValue(state, 'message.tags.1.deep')).toEqual({ isFound: true, value: 7 });
  expect(findPathValue(state, 'message.tags[0]')).toEqual({ isFound: true, value: 'a' });
  expect(findPathValue(state, 'message.tags[1].deep')).toEqual({ isFound: true, value: 7 });
  expect(findPathValue(state, 'message.tags.0')).toEqual({ isFound: false });
  expect(findPathValue(state, 'empty')).toEqual({ isFound: true, value: null });
}

function validateBracketIndexesOnlyStepIntoArrays() {
  const userState = { userMessageArray: ['feature request:', 'hovering over ...'], criteria: { 0: 'x' }, grid: [['a', 'b']] };
  expect(replaceReferences('`userMessageArray[1]`', userState, {})).toBe(formatReferenceValue('hovering over ...'));
  expect(replaceReferences('`userMessageArray[5]`', userState, {})).toBe('`userMessageArray[5]`');
  expect(replaceReferences('`userMessageArray.0`', userState, {})).toBe('`userMessageArray.0`');
  expect(replaceReferences('`criteria.0`', userState, {})).toBe(formatReferenceValue('x'));
  expect(replaceReferences('`criteria[0]`', userState, {})).toBe('`criteria[0]`');
  expect(replaceReferences('`grid[0][1]`', userState, {})).toBe(formatReferenceValue('b'));
  expect(findPathValue(userState, '.')).toEqual({ isFound: false });
}

function validatePathLookupReportsMissingPaths() {
  expect(findPathValue(state, 'message.nope')).toEqual({ isFound: false });
  // expect(findPathValue(state, 'message.tags.5')).toEqual({ isFound: false });
  expect(findPathValue(state, 'message.tags[5]')).toEqual({ isFound: false });
  expect(findPathValue(state, 'message.tags.length')).toEqual({ isFound: false });
  expect(findPathValue(state, 'count.deeper')).toEqual({ isFound: false });
  expect(findPathValue(state, 'constructor')).toEqual({ isFound: false });
  expect(findPathValue(null, 'a')).toEqual({ isFound: false });
}

function validateNonStringValuesAreWrittenAsJson() {
  expect(formatReferenceValue('hi')).toBe("'hi'");
  expect(formatReferenceValue(3)).toBe("'3'");
  expect(formatReferenceValue({ a: [1, true] })).toBe('\'{"a":[1,true]}\'');
  expect(formatReferenceValue(null)).toBe("'null'");
}

function validateTitleReferencesAreReplacedFromStateThenQuestions() {
  const title = 'Q1 requestsAction · Does `message.text` ask the reader to do something?';
  expect(replaceReferences(title, state, {})).toBe("Q1 requestsAction · Does 'Please send me the report by Friday.' ask the reader to do something?");
  // expect(replaceReferences('`count` and `message.tags.1.deep`', state, {})).toBe("'3' and '7'");
  expect(replaceReferences('`count` and `message.tags[1].deep`', state, {})).toBe("'3' and '7'");
  expect(replaceReferences('`other.name`', state, { other: { name: 'from questions' } })).toBe("'from questions'");
  expect(replaceReferences('`message.text`', { message: { text: 'state wins' } }, { message: { text: 'questions' } })).toBe("'state wins'");
}

function validateMissingReferencesStayAsTyped() {
  expect(replaceReferences('Does `missing.path` and `count` work?', state, {})).toBe("Does `missing.path` and '3' work?");
  expect(replaceReferences('no references here', state, {})).toBe('no references here');
}

test('test_path_lookup_walks_object_keys_and_array_indexes', validatePathLookupWalksObjectKeysAndArrayIndexes);
test('test_bracket_indexes_only_step_into_arrays', validateBracketIndexesOnlyStepIntoArrays);
test('test_path_lookup_reports_missing_paths', validatePathLookupReportsMissingPaths);
test('test_non_string_values_are_written_as_json', validateNonStringValuesAreWrittenAsJson);
test('test_title_references_are_replaced_from_state_then_questions', validateTitleReferencesAreReplacedFromStateThenQuestions);
test('test_missing_references_stay_as_typed', validateMissingReferencesStayAsTyped);
