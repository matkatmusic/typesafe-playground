// import { StateEffect } from '@codemirror/state';
// import { EditorView, type ViewUpdate } from '@codemirror/view';
import type { Draft } from '../playgroundDraftRequests';
import { isEditorTextEdited } from './editedPosition';
import { getQuestionsEditor, getStateEditor, replaceEditorText } from './editors';
import { markPageChanged } from './pageChanged';
import { pageState } from './state';
// import type { PageData } from './types';
import { sendJson } from './versionActions';
import { refreshVersionBox } from './versionBox';

const SESSION_ID_KEY = 'playgroundSessionId';
const DRAFT_INTERVAL_MS = 2000;

let sessionId = '';
let lastSentState = '';
let lastSentQuestions = '';
let pendingDraftWrite: Promise<unknown> = Promise.resolve();

// export function sendDraft(): Promise<unknown> {
//   const body = { state: getStateEditor().state.doc.toString(), questions: getQuestionsEditor().state.doc.toString() };
//   function sendBody(): Promise<Response> {
//     return sendJson('/draft', body);
//   }
//   pendingDraftWrite = pendingDraftWrite.then(sendBody);
//   return pendingDraftWrite;
// }
function readDraftTexts(): Draft {
  const draft = pageState.editedDraft;
  const isDraftHidden = draft !== null && !isEditorTextEdited();
  if (isDraftHidden)
    return { state: draft.state, questions: draft.questions };
  return { state: getStateEditor().state.doc.toString(), questions: getQuestionsEditor().state.doc.toString() };
}

export function sendDraft(): Promise<unknown> {
  // const state = getStateEditor().state.doc.toString();
  // const questions = getQuestionsEditor().state.doc.toString();
  const { state, questions } = readDraftTexts();
  lastSentState = state;
  lastSentQuestions = questions;
  const body = { id: sessionId, state, questions };
  function sendBody(): Promise<Response> {
    return sendJson('/draft', body);
  }
  pendingDraftWrite = pendingDraftWrite.then(sendBody);
  return pendingDraftWrite;
}

export function syncDraftOnTick(): void {
  // const isStateChanged = getStateEditor().state.doc.toString() !== lastSentState;
  // const isQuestionsChanged = getQuestionsEditor().state.doc.toString() !== lastSentQuestions;
  const { state, questions } = readDraftTexts();
  const isStateChanged = state !== lastSentState;
  const isQuestionsChanged = questions !== lastSentQuestions;
  const isChanged = isStateChanged || isQuestionsChanged;
  if (!isChanged)
    return;
  void sendDraft();
}

// export function syncDraftOnChange(update: ViewUpdate): void {
//   if (!update.docChanged)
//     return;
//   void sendDraft();
// }
//
// export function attachDraftSync(): void {
//   const effects = StateEffect.appendConfig.of(EditorView.updateListener.of(syncDraftOnChange));
//   getStateEditor().dispatch({ effects });
//   getQuestionsEditor().dispatch({ effects });
// }

export async function fetchDraft(id: string): Promise<Draft | null> {
  const response = await fetch(`/draft?id=${id}`);
  if (!response.ok)
    throw new Error(`HTTP ${response.status} ${await response.text()}`);
  return response.json();
}

// export function applyDraft(draft: PageData['draft']): void {
export function applyDraft(draft: Draft | null): void {
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

function createSessionId(): string {
  const id = crypto.randomUUID();
  sessionStorage.setItem(SESSION_ID_KEY, id);
  return id;
}

export async function launchDraftSession(): Promise<void> {
  const storedId = sessionStorage.getItem(SESSION_ID_KEY);
  sessionId = storedId ?? createSessionId();
  if (storedId !== null)
    applyDraft(await fetchDraft(storedId));
  lastSentState = getStateEditor().state.doc.toString();
  lastSentQuestions = getQuestionsEditor().state.doc.toString();
  setInterval(syncDraftOnTick, DRAFT_INTERVAL_MS);
}
