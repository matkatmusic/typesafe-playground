import { readProvider, readTypedKey, refreshSubmitAvailability } from '../keys/apiKey';
import { getSingleArrayError } from '../batch/batchPlan';
import { getButton, getElement, getInput } from '../page/dom';
import type { EditorView } from '@codemirror/view';
import { listQuestionsErrors, listStateErrors, listUndefinedReferences } from '../../typesafe-checks/typesafeChecks';
import { getQuestionsEditor, getStateEditor, setEditorLocked } from '../editors/editors';
import { computeJsonParseResult } from '../editors/jsonParse';
import { markPageChanged } from '../page/pageChanged';
import { isKindTextEdited } from '../notes/noteKind';
import { saveInheritedNote } from '../notes/saveVersionNote';
import { getShownVersion, pageState } from '../page/state';
import type { RunBody, RunResult } from '../page/types';
import { renderShownVersion } from '../versions/versionBox';

export function getSubmitText(): string {
    return 'Submit (paid)';
}

export function getRunningText(): string {
    return 'running…';
}

export function buildRunBody(state: unknown, questions: unknown): RunBody {
    return { index: pageState.index, calls: Number(getInput('callsPicker').value), apiKey: readTypedKey(), provider: readProvider(), state: state, questions: questions };
}

export function sendRun(runBody: RunBody): Promise<Response> {
    return fetch('/run', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(runBody) });
}

export function formatRunFailure(status: number, text: string): string {
    return `Run failed: ${status} ${text}`;
}

export function listLockableEditors(): EditorView[] {
    return [getStateEditor(), getQuestionsEditor()];
}

export function setEditorsLocked(isLocked: boolean): void {
    for (const editor of listLockableEditors())
        setEditorLocked(editor, isLocked);
}

export function listSubmitErrors(state: unknown, questions: unknown): string[] {
    const shapeErrors = [...listStateErrors(state), ...listQuestionsErrors(questions)];
    const hasShapeErrors = shapeErrors.length > 0;
    if (hasShapeErrors)
        return shapeErrors;
    return listUndefinedReferences(state, questions as Record<string, unknown>);
}

interface SubmitInputs { errorMessage: string; state: unknown; questions: unknown }

function computeSubmitInputs(): SubmitInputs {
    const stateResult = computeJsonParseResult('state', getStateEditor().state.doc.toString());
    if (!stateResult.isValid)
        return { errorMessage: stateResult.errorMessage, state: null, questions: null };
    const isStateArray = Array.isArray(stateResult.value);
    if (isStateArray)
        return { errorMessage: getSingleArrayError(), state: null, questions: null };
    const questionsResult = computeJsonParseResult('questions', getQuestionsEditor().state.doc.toString());
    if (!questionsResult.isValid)
        return { errorMessage: questionsResult.errorMessage, state: null, questions: null };
    const submitErrors = listSubmitErrors(stateResult.value, questionsResult.value);
    return { errorMessage: submitErrors.join('; '), state: stateResult.value, questions: questionsResult.value };
}

async function saveRunResult(result: RunResult, baseVersion: ReturnType<typeof getShownVersion>, isStateUnchanged: boolean, isQuestionsUnchanged: boolean): Promise<void> {
    // pageState.versions[result.version.id - 1] = result.version;
    pageState.versions[result.index] = result.version;
    const isInputUnchanged = isStateUnchanged && isQuestionsUnchanged;
    pageState.index = result.index;
    if (!isInputUnchanged) {
        await saveInheritedNote('state', baseVersion.stateNote, isStateUnchanged, result.version);
        await saveInheritedNote('questions', baseVersion.questionsNote, isQuestionsUnchanged, result.version);
    }
    pageState.editedDraft = null;
    markPageChanged('last run');
    renderShownVersion();
}

async function sendRunAndRecordResult(inputs: SubmitInputs, errorLine: HTMLElement): Promise<void> {
    const baseVersion = getShownVersion();
    const isStateUnchanged = !isKindTextEdited('state');
    const isQuestionsUnchanged = !isKindTextEdited('questions');
    const response = await sendRun(buildRunBody(inputs.state, inputs.questions));
    getButton('submitButton').textContent = getSubmitText();
    refreshSubmitAvailability();
    if (!response.ok) {
        errorLine.textContent = formatRunFailure(response.status, await response.text());
        return;
    }
    const result: RunResult = await response.json();
    await saveRunResult(result, baseVersion, isStateUnchanged, isQuestionsUnchanged);
}

async function executeRunWithEditorsLocked(inputs: SubmitInputs, errorLine: HTMLElement): Promise<void> {
    const submitButton = getButton('submitButton');
    submitButton.disabled = true;
    submitButton.textContent = getRunningText();
    setEditorsLocked(true);
    try {
        await sendRunAndRecordResult(inputs, errorLine);
    }
    finally {
        setEditorsLocked(false);
    }
}

export async function executeSubmit(): Promise<void> {
    const errorLine = getElement('errorLine');
    errorLine.textContent = '';
    const inputs = computeSubmitInputs();
    const hasInputErrors = inputs.errorMessage !== '';
    if (hasInputErrors) {
        errorLine.textContent = inputs.errorMessage;
        return;
    }
    await executeRunWithEditorsLocked(inputs, errorLine);
}
