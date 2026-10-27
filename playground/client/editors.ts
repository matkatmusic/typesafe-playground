import { basicSetup, EditorView } from 'codemirror';
import { indentWithTab } from '@codemirror/commands';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { syntaxHighlighting } from '@codemirror/language';
import { linter, lintGutter } from '@codemirror/lint';
import { Annotation, Compartment, EditorState, type Extension } from '@codemirror/state';
import { keymap, type ViewUpdate } from '@codemirror/view';
import { createAddQuestion } from './addQuestion';
import { createBacktickKeyNames } from './backtickCompletion';
import { getElement } from './dom';
import { jsonHighlight } from './editorHighlight';
import { createPlaceholders } from './placeholders';
import { createPlaceholderTab } from './placeholderTab';
import { clearQuestionsJsonError, clearStateJsonError } from './stateErrorClear';

export const EDITOR_THEME_RULES = {
  '&': { height: '100%', background: 'var(--panel)', color: 'var(--text)', border: '1px solid var(--grid)', borderRadius: '6px' },
  '.cm-scroller': { overflow: 'auto', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '13px' },
  '.cm-gutters': { background: 'var(--panel)', color: 'var(--text-muted)', border: 'none' },
};

export const FILL_ANNOTATION = Annotation.define<boolean>();
export const LOCK_COMPARTMENT = new Compartment();
export const LOCKED_EXTENSIONS: Extension[] = [EditorView.editable.of(false), EditorState.readOnly.of(true)];

let resultEditor: EditorView | null = null;
let stateEditor: EditorView | null = null;
let questionsEditor: EditorView | null = null;

export function buildResultExtensions(): Extension[] {
  return [
    basicSetup,
    json(),
    EditorView.lineWrapping,
    EditorView.theme(EDITOR_THEME_RULES),
    EditorState.readOnly.of(true),
  ];
}

export function buildJsonExtensions(): Extension[] {
  return [
    basicSetup,
    json(),
    EditorView.lineWrapping,
    syntaxHighlighting(jsonHighlight),
    EditorView.theme(EDITOR_THEME_RULES),
    linter(jsonParseLinter()),
    lintGutter(),
    createBacktickKeyNames(),
    keymap.of([indentWithTab]),
    LOCK_COMPARTMENT.of([]),
  ];
}

export function formatResultJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function createResultEditor(): EditorView {
  resultEditor = new EditorView({ doc: '{}', extensions: buildResultExtensions(), parent: getElement('resultJsonEditor') });
  return resultEditor;
}

export function getResultEditor(): EditorView {
  if (resultEditor === null)
    throw new Error('result editor is not created yet');
  return resultEditor;
}

function buildInputEditor(parentId: string, clearError: (update: ViewUpdate) => void, onEditorChange: (update: ViewUpdate) => void, extraExtensions: Extension[]): EditorView {
  const extensions = [buildJsonExtensions(), EditorView.updateListener.of(clearError), EditorView.updateListener.of(onEditorChange), extraExtensions];
  return new EditorView({ doc: '', extensions: extensions, parent: getElement(parentId) });
}

export function createStateEditor(onEditorChange: (update: ViewUpdate) => void): EditorView {
  stateEditor = buildInputEditor('stateJsonEditor', clearStateJsonError, onEditorChange, []);
  return stateEditor;
}

export function getStateEditor(): EditorView {
  if (stateEditor === null)
    throw new Error('state editor is not created yet');
  return stateEditor;
}

export function createQuestionsEditor(onEditorChange: (update: ViewUpdate) => void): EditorView {
  questionsEditor = buildInputEditor('questionsJsonEditor', clearQuestionsJsonError, onEditorChange, [createAddQuestion(), createPlaceholders(), createPlaceholderTab()]);
  return questionsEditor;
}

export function getQuestionsEditor(): EditorView {
  if (questionsEditor === null)
    throw new Error('questions editor is not created yet');
  return questionsEditor;
}

export function replaceEditorText(editor: EditorView, text: string): void {
  editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: text }, annotations: FILL_ANNOTATION.of(true) });
}

export function setEditorLocked(editor: EditorView, isLocked: boolean): void {
  editor.dispatch({ effects: LOCK_COMPARTMENT.reconfigure(isLocked ? LOCKED_EXTENSIONS : []), annotations: FILL_ANNOTATION.of(true) });
}

export function renderResultJson(value: unknown): void {
  replaceEditorText(getResultEditor(), formatResultJson(value));
}

export function renderStateJson(value: unknown): void {
  replaceEditorText(getStateEditor(), formatResultJson(value));
}

export function renderQuestionsJson(value: unknown): void {
  replaceEditorText(getQuestionsEditor(), formatResultJson(value));
}
