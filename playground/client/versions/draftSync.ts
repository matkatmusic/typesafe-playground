import type { EditorView } from '@codemirror/view';
import type { Draft } from '../../server/playgroundDraftRequests';
import { applyBatchMode } from '../batch/batchControls';
import { isEditorTextEdited } from './editedPosition';
import { fillEditorText, getQuestionsEditor, getStateEditor } from '../editors/editors';
import { markPageChanged } from '../page/pageChanged';
import { pageState } from '../page/state';
import { sendJson } from './versionActions';
import { refreshVersionBox } from './versionBox';

const SESSION_ID_KEY = 'playgroundSessionId';
const DRAFT_INTERVAL_MS = 2000;

let sessionId = '';
let lastSentState = '';
let lastSentQuestions = '';
let lastSentBatch = false;
let pendingDraftWrite: Promise<unknown> = Promise.resolve();

function readDraftTexts(): Draft {
  const draft = pageState.editedDraft;
  const isBatch = pageState.isBatchOn;
  const isDraftHidden = draft !== null && !isEditorTextEdited();
  if (isDraftHidden)
    return { state: draft.state, questions: draft.questions, isBatch };
  return { state: getStateEditor().state.doc.toString(), questions: getQuestionsEditor().state.doc.toString(), isBatch };
}

export function sendDraft(): Promise<unknown> {
  const { state, questions, isBatch } = readDraftTexts();
  lastSentState = state;
  lastSentQuestions = questions;
  lastSentBatch = isBatch;
  const body = { id: sessionId, state, questions, isBatch };
  function sendBody(): Promise<Response> {
    return sendJson('/draft', body);
  }
  pendingDraftWrite = pendingDraftWrite.then(sendBody);
  return pendingDraftWrite;
}

export function syncDraftOnTick(): void {
  const { state, questions, isBatch } = readDraftTexts();
  const isStateChanged = state !== lastSentState;
  const isQuestionsChanged = questions !== lastSentQuestions;
  const isBatchChanged = isBatch !== lastSentBatch;
  const isChanged = isStateChanged || isQuestionsChanged || isBatchChanged;
  if (!isChanged)
    return;
  void sendDraft();
}


export async function fetchDraft(id: string): Promise<Draft | null> {
  const response = await fetch(`/draft?id=${id}`);
  if (!response.ok)
    throw new Error(`HTTP ${response.status} ${await response.text()}`);
  return response.json();
}

function fillEditorIfTextDiffers(editor: EditorView, text: string): boolean {
  const isTextDifferent = text !== editor.state.doc.toString();
  if (isTextDifferent)
    fillEditorText(editor, text);
  return isTextDifferent;
}

export function applyDraft(draft: Draft | null): void {
  if (draft === null)
    return;
  const isStateDifferent = fillEditorIfTextDiffers(getStateEditor(), draft.state);
  const isQuestionsDifferent = fillEditorIfTextDiffers(getQuestionsEditor(), draft.questions);
  const isDraftBatch = draft.isBatch === true;
  const isBatchDifferent = isDraftBatch !== pageState.isBatchOn;
  if (isBatchDifferent)
    applyBatchMode(isDraftBatch);
  const isRestored = isStateDifferent || isQuestionsDifferent || isBatchDifferent;
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
  lastSentBatch = pageState.isBatchOn;
  setInterval(syncDraftOnTick, DRAFT_INTERVAL_MS);
}
