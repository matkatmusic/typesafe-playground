import { test, expect } from 'bun:test'
import { jsonParseLinter } from '@codemirror/lang-json'
import { highlightingFor } from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import { tags } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'
import { jsonHighlight } from './editorHighlight'
import { buildJsonExtensions, buildResultExtensions, createResultEditor, createStateEditor, EDITOR_THEME_RULES, FILL_ANNOTATION, formatResultJson, getResultEditor, getStateEditor, renderResultJson, renderStateJson, setEditorLocked } from './editors'

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

function validateStateEditorUsesTheJsonHighlightStyleAndResultEditorDoesNot() {
    const stateEditorState = EditorState.create({ doc: '"a"', extensions: buildJsonExtensions() })
    expect(highlightingFor(stateEditorState, [tags.string])).toBe(jsonHighlight.style([tags.string]))
    const resultEditorState = EditorState.create({ doc: '"a"', extensions: buildResultExtensions() })
    expect(highlightingFor(resultEditorState, [tags.string])).not.toBe(jsonHighlight.style([tags.string]))
}

function validateStateEditorStaysWritable() {
    const state = EditorState.create({ doc: '', extensions: buildJsonExtensions() })
    expect(state.readOnly).toBe(false)
    expect(state.update({ changes: { from: 0, insert: '{}' } }).state.doc.toString()).toBe('{}')
}

function validateStateEditorFunctionsThrowBeforeTheEditorExists() {
    expect(() => createStateEditor(ignoreUpdate)).toThrow()
    expect(() => getStateEditor()).toThrow('state editor is not created yet')
    expect(() => renderStateJson({})).toThrow('state editor is not created yet')
}

function ignoreUpdate() {}

function validateFillTransactionsCarryTheAnnotation() {
    const state = EditorState.create({ doc: '{}' })
    const fill = state.update({ changes: { from: 0, to: 2, insert: '[]' }, annotations: FILL_ANNOTATION.of(true) })
    const typed = state.update({ changes: { from: 0, to: 2, insert: '[]' } })
    expect(fill.annotation(FILL_ANNOTATION)).toBe(true)
    expect(typed.annotation(FILL_ANNOTATION)).toBeUndefined()
}

function validateLockingTheEditorTogglesReadOnlyAndEditableWithoutMarkingAFill() {
    const stubEditor = { state: EditorState.create({ doc: '{}', extensions: buildJsonExtensions() }), fillFlags: [] as (boolean | undefined)[] }
    function applyDispatch(spec: Parameters<EditorState['update']>[0]) {
        const transaction = stubEditor.state.update(spec)
        stubEditor.fillFlags.push(transaction.annotation(FILL_ANNOTATION))
        stubEditor.state = transaction.state
    }
    const editor = { dispatch: applyDispatch } as unknown as EditorView
    setEditorLocked(editor, true)
    expect(stubEditor.state.readOnly).toBe(true)
    expect(stubEditor.state.facet(EditorView.editable)).toBe(false)
    setEditorLocked(editor, false)
    expect(stubEditor.state.readOnly).toBe(false)
    expect(stubEditor.state.facet(EditorView.editable)).toBe(true)
    expect(stubEditor.state.doc.toString()).toBe('{}')
    expect(stubEditor.fillFlags).toEqual([true, true])
}

test('test_locking_the_editor_toggles_read_only_and_editable_without_marking_a_fill', validateLockingTheEditorTogglesReadOnlyAndEditableWithoutMarkingAFill)
test('test_fill_transactions_carry_the_annotation', validateFillTransactionsCarryTheAnnotation)
test('test_linter_flags_invalid_json_only', validateLinterFlagsInvalidJsonOnly)
test('test_state_editor_uses_the_json_highlight_style_and_result_editor_does_not', validateStateEditorUsesTheJsonHighlightStyleAndResultEditorDoesNot)
test('test_state_editor_stays_writable', validateStateEditorStaysWritable)
test('test_state_editor_functions_throw_before_the_editor_exists', validateStateEditorFunctionsThrowBeforeTheEditorExists)
test('test_theme_fills_the_result_box', validateThemeFillsTheBox)
test('test_result_json_is_pretty_printed_with_two_spaces', validateResultJsonIsPrettyPrintedWithTwoSpaces)
test('test_result_state_is_read_only_but_accepts_programmatic_text', validateResultStateIsReadOnlyButAcceptsProgrammaticText)
test('test_editor_functions_throw_before_the_editor_exists', validateEditorFunctionsThrowBeforeTheEditorExists)
