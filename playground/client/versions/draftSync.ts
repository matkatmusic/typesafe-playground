import type { EditorView } from '@codemirror/view';
import type { Draft } from '../../server/playgroundDraftRequests';
import { applyBatchMode } from '../batch/batchControls';
import { isEditorTextEdited } from './editedPosition';
import { fillEditorText, getQuestionsEditor, getStateEditor } from '../editors/editors';
import { markPageChanged } from '../page/pageChanged';
import { pageState } from '../page/state';
import { sendJson } from './versionActions';
import { refreshVersionBox } from './versionBox';

class draftSession {
    public static readonly sessionIdKey = 'playgroundSessionId';
    public static readonly draftIntervalMs = 2000;
    public static sessionId = '';
    public static lastSentState = '';
    public static lastSentQuestions = '';
    public static lastSentBatch = false;
    public static pendingDraftWrite: Promise<unknown> = Promise.resolve();
    private static instance: draftSession | undefined;

    private constructor() {}

    public static getInstance(): draftSession {
        if (draftSession.instance === undefined) {
            draftSession.instance = new draftSession();
        }
        return draftSession.instance;
    }
}

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
    draftSession.lastSentState = state;
    draftSession.lastSentQuestions = questions;
    draftSession.lastSentBatch = isBatch;
    const body = { id: draftSession.sessionId, state, questions, isBatch };
    function sendBody(): Promise<Response> {
        return sendJson('/draft', body);
    }
    draftSession.pendingDraftWrite = draftSession.pendingDraftWrite.then(sendBody);
    return draftSession.pendingDraftWrite;
}

export function syncDraftOnTick(): void {
    const { state, questions, isBatch } = readDraftTexts();
    const isStateChanged = state !== draftSession.lastSentState;
    const isQuestionsChanged = questions !== draftSession.lastSentQuestions;
    const isBatchChanged = isBatch !== draftSession.lastSentBatch;
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
    sessionStorage.setItem(draftSession.sessionIdKey, id);
    return id;
}

export async function launchDraftSession(): Promise<void> {
    const storedId = sessionStorage.getItem(draftSession.sessionIdKey);
    draftSession.sessionId = storedId ?? createSessionId();
    if (storedId !== null)
        applyDraft(await fetchDraft(storedId));
    draftSession.lastSentState = getStateEditor().state.doc.toString();
    draftSession.lastSentQuestions = getQuestionsEditor().state.doc.toString();
    draftSession.lastSentBatch = pageState.isBatchOn;
    setInterval(syncDraftOnTick, draftSession.draftIntervalMs);
}
