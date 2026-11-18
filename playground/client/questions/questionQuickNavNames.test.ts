import { test, expect } from 'bun:test';
import { createState } from './questionQuickNavFakeDom';
import { findQuestionPosition, listQuestionNames } from './questionQuickNav';

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

test('test_list_question_names_returns_only_top_level_names', validateListQuestionNamesReturnsOnlyTopLevelNames);
test('test_list_question_names_is_empty_when_the_root_is_not_an_object', validateListQuestionNamesIsEmptyWhenTheRootIsNotAnObject);
test('test_find_question_position_returns_the_offset_of_the_named_property', validateFindQuestionPositionReturnsTheOffsetOfTheNamedProperty);
test('test_find_question_position_ignores_a_nested_key_with_the_same_name', validateFindQuestionPositionIgnoresANestedKeyWithTheSameName);
test('test_find_question_position_returns_null_for_a_missing_name_or_a_non_object_root', validateFindQuestionPositionReturnsNullForAMissingNameOrANonObjectRoot);
