import { basicSetup, EditorView } from 'codemirror';
import { indentWithTab } from '@codemirror/commands';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { syntaxHighlighting } from '@codemirror/language';
import { linter, lintGutter } from '@codemirror/lint';
import { Annotation, Compartment, EditorState, type Extension } from '@codemirror/state';
import { keymap, type ViewUpdate } from '@codemirror/view';
import { getElement } from './dom';
import { jsonHighlight } from './editorHighlight';
import { clearStateJsonError } from './stateErrorClear';

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

export function createStateEditor(onEditorChange: (update: ViewUpdate) => void): EditorView {
  const extensions = [buildJsonExtensions(), EditorView.updateListener.of(clearStateJsonError), EditorView.updateListener.of(onEditorChange)];
  stateEditor = new EditorView({ doc: '', extensions: extensions, parent: getElement('stateJsonEditor') });
  return stateEditor;
}

export function getStateEditor(): EditorView {
  if (stateEditor === null)
    throw new Error('state editor is not created yet');
  return stateEditor;
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
