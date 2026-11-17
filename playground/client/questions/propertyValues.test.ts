import { test, expect } from 'bun:test';
import { jsonLanguage, json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import { splitKeyPath } from './propertyNames';
import { findEditorValueText, findValueText } from './propertyValues';
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
test('test_find_value_text_steps_into_arrays', validateFindsValueTextInsideArrays);
test('test_find_value_text_reads_string_and_object_values', validateFindsStringAndObjectValueText);
test('test_find_value_text_is_null_when_missing', validateFindValueTextIsNullWhenMissing);
test('test_find_editor_value_text_reads_syntax_tree', validateFindsValueTextFromEditorState);
