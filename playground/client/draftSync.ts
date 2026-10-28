import { StateEffect } from '@codemirror/state';
import { EditorView, type ViewUpdate } from '@codemirror/view';
import { getQuestionsEditor, getStateEditor, replaceEditorText } from './editors';
import { markPageChanged } from './pageChanged';
import type { PageData } from './types';
import { sendJson } from './versionActions';
import { refreshVersionBox } from './versionBox';

let pendingDraftWrite: Promise<unknown> = Promise.resolve();

export function sendDraft(): Promise<unknown> {
  const body = { state: getStateEditor().state.doc.toString(), questions: getQuestionsEditor().state.doc.toString() };
  function sendBody(): Promise<Response> {
    return sendJson('/draft', body);
  }
  pendingDraftWrite = pendingDraftWrite.then(sendBody);
  return pendingDraftWrite;
}

export function syncDraftOnChange(update: ViewUpdate): void {
  if (!update.docChanged)
    return;
  void sendDraft();
}

export function attachDraftSync(): void {
  const effects = StateEffect.appendConfig.of(EditorView.updateListener.of(syncDraftOnChange));
  getStateEditor().dispatch({ effects });
  getQuestionsEditor().dispatch({ effects });
}

export function applyDraft(draft: PageData['draft']): void {
  if (draft === null)
    return;
  const stateEditor = getStateEditor();
  const questionsEditor = getQuestionsEditor();
  const isStateDifferent = draft.state !== stateEditor.state.doc.toString();
  if (isStateDifferent)
    replaceEditorText(stateEditor, draft.state);
  const isQuestionsDifferent = draft.questions !== questionsEditor.state.doc.toString();
  if (isQuestionsDifferent)
    replaceEditorText(questionsEditor, draft.questions);
  const isRestored = isStateDifferent || isQuestionsDifferent;
  if (!isRestored)
    return;
  refreshVersionBox();
  markPageChanged('last edited');
}
