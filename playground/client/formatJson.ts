import type { EditorView } from '@codemirror/view';
import { getElement } from './dom';
import { getQuestionsEditor, getStateEditor, replaceEditorText } from './editors';
import { computeJsonParseResult } from './jsonParse';

export function formatEditorJson(label: string, editor: EditorView): void {
  const errorLine = getElement('errorLine');
  const parseResult = computeJsonParseResult(label, editor.state.doc.toString());
  if (!parseResult.isValid) {
    errorLine.textContent = parseResult.errorMessage;
    return;
  }
  replaceEditorText(editor, JSON.stringify(parseResult.value, null, 2));
}

export function formatStateJson(): void {
  formatEditorJson('state', getStateEditor());
}

export function formatQuestionsJson(): void {
  formatEditorJson('questions', getQuestionsEditor());
}
