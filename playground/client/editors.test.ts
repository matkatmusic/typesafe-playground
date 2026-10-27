import { test, expect } from 'bun:test'
import { EditorState } from '@codemirror/state'
import { buildResultExtensions, createResultEditor, EDITOR_THEME_RULES, formatResultJson, getResultEditor, renderResultJson } from './editors'

function validateThemeFillsTheBox() {
    expect(EDITOR_THEME_RULES['&'].height).toBe('100%')
}

function validateResultJsonIsPrettyPrintedWithTwoSpaces() {
    expect(formatResultJson({ a: 1, b: [true, null] })).toBe('{\n  "a": 1,\n  "b": [\n    true,\n    null\n  ]\n}')
}

function validateResultStateIsReadOnlyButAcceptsProgrammaticText() {
    const state = EditorState.create({ doc: '{}', extensions: buildResultExtensions() })
    expect(state.readOnly).toBe(true)
    expect(state.doc.toString()).toBe('{}')
    const next = state.update({ changes: { from: 0, to: state.doc.length, insert: formatResultJson({ x: 1 }) } }).state
    expect(next.doc.toString()).toBe('{\n  "x": 1\n}')
}

function validateEditorFunctionsThrowBeforeTheEditorExists() {
    expect(() => createResultEditor()).toThrow()
    expect(() => getResultEditor()).toThrow('result editor is not created yet')
    expect(() => renderResultJson({})).toThrow('result editor is not created yet')
}

test('test_theme_fills_the_result_box', validateThemeFillsTheBox)
test('test_result_json_is_pretty_printed_with_two_spaces', validateResultJsonIsPrettyPrintedWithTwoSpaces)
test('test_result_state_is_read_only_but_accepts_programmatic_text', validateResultStateIsReadOnlyButAcceptsProgrammaticText)
test('test_editor_functions_throw_before_the_editor_exists', validateEditorFunctionsThrowBeforeTheEditorExists)
