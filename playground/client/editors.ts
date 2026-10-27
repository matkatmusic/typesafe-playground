import { basicSetup, EditorView } from 'codemirror';
import { json } from '@codemirror/lang-json';
import { EditorState, type Extension } from '@codemirror/state';
import { getElement } from './dom';

export const EDITOR_THEME_RULES = {
  '&': { height: '100%', background: 'var(--panel)', color: 'var(--text)', border: '1px solid var(--grid)', borderRadius: '6px' },
  '.cm-scroller': { overflow: 'auto', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '13px' },
  '.cm-gutters': { background: 'var(--panel)', color: 'var(--text-muted)', border: 'none' },
};

let resultEditor: EditorView | null = null;

export function buildResultExtensions(): Extension[] {
  return [
    basicSetup,
    json(),
    EditorView.lineWrapping,
    EditorView.theme(EDITOR_THEME_RULES),
    EditorState.readOnly.of(true),
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

export function replaceEditorText(editor: EditorView, text: string): void {
  editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: text } });
}

export function renderResultJson(value: unknown): void {
  replaceEditorText(getResultEditor(), formatResultJson(value));
}
