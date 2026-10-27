import { test, expect, afterEach } from 'bun:test'
import type { EditorView } from '@codemirror/view'
import { isInputUnchanged } from '../playgroundRequests'
import { FILL_ANNOTATION } from './editors'
import { formatEditorJson } from './formatJson'
import { isJsonTextEdited } from './versionLabel'

class FakeBox { textContent = '' }

afterEach(removeFakeDom)

function removeFakeDom() {
    Reflect.deleteProperty(globalThis, 'document')
}

function installFakeErrorLine() {
    const errorLine = new FakeBox()
    Object.assign(globalThis, { document: { getElementById: () => errorLine } })
    return errorLine
}

function buildFakeEditor(text: string) {
    const dispatched: { changes: { insert: string }; annotations: unknown }[] = []
    const state = { doc: { length: text.length, toString: () => text } }
    const view = { state, dispatch: (spec: never) => dispatched.push(spec) } as unknown as EditorView
    return { view, dispatched }
}

function validateFormatReplacesTheTextWithTwoSpacePrettyJsonAsAFill() {
    installFakeErrorLine()
    const { view, dispatched } = buildFakeEditor('{"a":1,"b":[true]}')
    formatEditorJson('state', view)
    expect(dispatched.length).toBe(1)
    expect(dispatched[0].changes.insert).toBe('{\n  "a": 1,\n  "b": [\n    true\n  ]\n}')
    expect(dispatched[0].annotations).toEqual(FILL_ANNOTATION.of(true))
}

function validateFormatOfInvalidJsonShowsTheErrorAndChangesNothing() {
    const errorLine = installFakeErrorLine()
    const { view, dispatched } = buildFakeEditor('{"a":')
    formatEditorJson('questions', view)
    expect(dispatched).toEqual([])
    expect(errorLine.textContent.startsWith('questions is not valid JSON')).toBe(true)
}

function validateFormattingNeverMakesAnEditedVersionOrANewRunVersion() {
    const savedState = { a: 1, b: [true] }
    const formattedText = JSON.stringify(savedState, null, 2)
    const version = { id: 1, time: 'now', state: savedState, questions: {}, calls: 1, outputs: [] }
    expect(isJsonTextEdited(formattedText, savedState)).toBe(false)
    expect(isJsonTextEdited(JSON.stringify(savedState), savedState)).toBe(false)
    expect(isInputUnchanged(version, JSON.parse(formattedText), {})).toBe(true)
    expect(isInputUnchanged(version, JSON.parse('{ "a": 2 }'), {})).toBe(false)
}

test('test_format_replaces_the_text_with_two_space_pretty_json_as_a_fill', validateFormatReplacesTheTextWithTwoSpacePrettyJsonAsAFill)
test('test_format_of_invalid_json_shows_the_error_and_changes_nothing', validateFormatOfInvalidJsonShowsTheErrorAndChangesNothing)
test('test_formatting_never_makes_an_edited_version_or_a_new_run_version', validateFormattingNeverMakesAnEditedVersionOrANewRunVersion)
