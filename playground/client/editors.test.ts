import { test, expect } from 'bun:test'
import { jsonParseLinter } from '@codemirror/lang-json'
import { EditorState } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import { buildJsonExtensions, buildResultExtensions, createResultEditor, createStateEditor, EDITOR_THEME_RULES, formatResultJson, getResultEditor, getStateEditor, renderResultJson, renderStateJson } from './editors'

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

function buildStubView(doc: string): EditorView {
    return { state: EditorState.create({ doc: doc, extensions: buildJsonExtensions() }) } as unknown as EditorView
}

function validateLinterFlagsInvalidJsonOnly() {
    const lint = jsonParseLinter()
    expect(lint(buildStubView('{"a":')).length).toBe(1)
    expect(lint(buildStubView('{"a":1}')).length).toBe(0)
}

function validateStateEditorStaysWritable() {
    const state = EditorState.create({ doc: '', extensions: buildJsonExtensions() })
    expect(state.readOnly).toBe(false)
    expect(state.update({ changes: { from: 0, insert: '{}' } }).state.doc.toString()).toBe('{}')
}

function validateStateEditorFunctionsThrowBeforeTheEditorExists() {
    expect(() => createStateEditor()).toThrow()
    expect(() => getStateEditor()).toThrow('state editor is not created yet')
    expect(() => renderStateJson({})).toThrow('state editor is not created yet')
}

test('test_linter_flags_invalid_json_only', validateLinterFlagsInvalidJsonOnly)
test('test_state_editor_stays_writable', validateStateEditorStaysWritable)
test('test_state_editor_functions_throw_before_the_editor_exists', validateStateEditorFunctionsThrowBeforeTheEditorExists)
test('test_theme_fills_the_result_box', validateThemeFillsTheBox)
test('test_result_json_is_pretty_printed_with_two_spaces', validateResultJsonIsPrettyPrintedWithTwoSpaces)
test('test_result_state_is_read_only_but_accepts_programmatic_text', validateResultStateIsReadOnlyButAcceptsProgrammaticText)
test('test_editor_functions_throw_before_the_editor_exists', validateEditorFunctionsThrowBeforeTheEditorExists)
