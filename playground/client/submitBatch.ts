import type { Version } from '../playgroundHistory';
import { applyBatchMode, refreshBatchControls } from './batchControls';
import { buildBatchVersions, computeBatchStateError, formatBatchFailures } from './batchPlan';
import type { BatchVersions } from './batchPlan';
import { renderTotalCost } from './costTokens';
import { getElement } from './dom';
import { sendDraft } from './draftSync';
import { getQuestionsEditor, getStateEditor } from './editors';
import type { JsonValue, Questions } from '@typesafe-ai/sdk';
import { computeJsonParseResult } from './jsonParse';
import { isQuestionsObject } from './jsonObjectGuards';
import { isKindTextEdited } from './noteKind';
import { markPageChanged } from './pageChanged';
import { saveVersionNote } from './saveVersionNote';
import { buildEmptyPendingNotes, getShownVersion, pageState } from './state';
// import { buildRunBody, executeSubmit, formatRunFailure, sendRun, setEditorsLocked } from './submit';
// import { buildRunBody, executeSubmit, formatRunFailure, listSubmitErrors, sendRun, setEditorsLocked } from './submit';
import { buildRunBody, executeSubmit, formatRunFailure, sendRun, setEditorsLocked } from './submit';
import { listQuestionsErrors, listStateErrors, listUndefinedReferences } from '../typesafe-checks/typesafeChecks';
import type { RunResult } from './types';
import { sendJson } from './versionActions';
import { renderShownVersion } from './versionBox';

type BatchQuestionsResult =
  | { isValid: true; questions: Questions }
  | { isValid: false; errorMessage: string };

type BatchInputResult =
  | { isValid: true; states: Record<string, JsonValue>[]; questions: Questions }
  | { isValid: false; errorMessage: string };

function parseBatchQuestions(): BatchQuestionsResult {
  const questionsResult = computeJsonParseResult('questions', getQuestionsEditor().state.doc.toString());
  if (!questionsResult.isValid)
    return { isValid: false, errorMessage: questionsResult.errorMessage };
  const questionsValue = questionsResult.value;
  const isQuestions = isQuestionsObject(questionsValue);
  if (!isQuestions)
    return { isValid: false, errorMessage: 'questions must be a JSON object' };
  return { isValid: true, questions: questionsValue };
}

function listItemReferenceErrors(itemNumber: number, state: Record<string, JsonValue>, questions: Questions): string[] {
  const referenceErrors: string[] = [];
  for (const error of listUndefinedReferences(state, questions))
    referenceErrors.push(`item ${itemNumber}: ${error}`);
  return referenceErrors;
}

function listItemErrors(states: Record<string, JsonValue>[], questions: Questions): string[] {
  // const itemErrors: string[] = [];
  // for (let i = 0; i < states.length; i++) {
  //   for (const error of listSubmitErrors(states[i], questions))
  //     itemErrors.push(`item ${i + 1}: ${error}`);
  // }
  const questionsErrors = listQuestionsErrors(questions);
  const itemErrors: string[] = [...questionsErrors];
  for (let i = 0; i < states.length; i++) {
    const stateErrors = listStateErrors(states[i]);
    for (const error of stateErrors)
      itemErrors.push(`item ${i + 1}: ${error}`);
    // Names are checked only when the state and questions have no shape errors.
    if (stateErrors.length === 0) {
      if (questionsErrors.length === 0)
        itemErrors.push(...listItemReferenceErrors(i + 1, states[i], questions));
    }
  }
  return itemErrors;
}

function buildBatchInputResult(states: Record<string, JsonValue>[], questions: Questions): BatchInputResult {
  const itemErrors = listItemErrors(states, questions);
  const hasItemErrors = itemErrors.length > 0;
  if (hasItemErrors)
    return { isValid: false, errorMessage: itemErrors.join('; ') };
  return { isValid: true, states, questions };
}

function parseBatchInput(): BatchInputResult {
  const stateResult = computeJsonParseResult('state', getStateEditor().state.doc.toString());
  if (!stateResult.isValid)
    return { isValid: false, errorMessage: stateResult.errorMessage };
  const batchError = computeBatchStateError(stateResult.value);
  if (batchError !== null)
    return { isValid: false, errorMessage: batchError };
  const questionsResult = parseBatchQuestions();
  if (!questionsResult.isValid)
    return { isValid: false, errorMessage: questionsResult.errorMessage };
  // const states = stateResult.value as unknown[];
  const states = stateResult.value as Record<string, JsonValue>[];
  return buildBatchInputResult(states, questionsResult.questions);
}

async function openPlannedVersions(plan: BatchVersions): Promise<void> {
  const openResponse = await sendJson('/open', { versions: plan.versions });
  const opened: { versions: Version[] } = await openResponse.json();
  pageState.versions = opened.versions;
  markPageChanged('last edited');
}

async function saveNewVersionQuestionsNotes(itemIndexes: number[], oldVersionCount: number, questionsNote: string): Promise<void> {
  for (const index of itemIndexes) {
    const isNewVersion = index >= oldVersionCount;
    if (isNewVersion)
      await saveVersionNote(pageState.versions[index], { kind: 'questions' }, questionsNote);
  }
}

async function openBatchVersions(states: Record<string, JsonValue>[], questions: Questions): Promise<BatchVersions> {
  const shownVersion = getShownVersion();
  const isQuestionsUnchanged = !isKindTextEdited('questions');
  const oldVersionCount = pageState.versions.length;
  const plan = buildBatchVersions(pageState.versions, pageState.index, states, questions);
  await openPlannedVersions(plan);
  const questionsNote = shownVersion.questionsNote;
  if (isQuestionsUnchanged) {
    if (questionsNote !== undefined)
      await saveNewVersionQuestionsNotes(plan.itemIndexes, oldVersionCount, questionsNote);
  }
  return plan;
}

async function renderOpenedBatch(plan: BatchVersions, itemCount: number): Promise<void> {
  pageState.editedDraft = null;
  pageState.pendingNotes = buildEmptyPendingNotes();
  pageState.index = plan.itemIndexes[0];
  pageState.batchRun = { item: 1, count: itemCount };
  applyBatchMode(false);
  renderShownVersion();
  await sendDraft();
}

async function applyRunResponse(response: Response): Promise<void> {
  const result: RunResult = await response.json();
  pageState.versions[result.index] = result.version;
  markPageChanged('last run');
  const isShownVersionRun = result.index === pageState.index;
  if (isShownVersionRun)
    renderShownVersion();
  else
    renderTotalCost();
}

async function executeBatchItems(states: Record<string, JsonValue>[], questions: Questions, plan: BatchVersions): Promise<string[]> {
  const failures: string[] = [];
  for (let i = 0; i < states.length; i++) {
    pageState.batchRun = { item: i + 1, count: states.length };
    refreshBatchControls();
    const runBody = { ...buildRunBody(states[i], questions), index: plan.itemIndexes[i] };
    const response = await sendRun(runBody);
    if (!response.ok)
      failures.push(`version ${plan.itemIndexes[i] + 1}: ${formatRunFailure(response.status, await response.text())}`);
    else
      await applyRunResponse(response);
  }
  return failures;
}

function clearBatchRun(): void {
  pageState.batchRun = null;
  setEditorsLocked(false);
  refreshBatchControls();
}

async function executeBatch(states: Record<string, JsonValue>[], questions: Questions): Promise<string[]> {
  setEditorsLocked(true);
  try {
    const plan = await openBatchVersions(states, questions);
    await renderOpenedBatch(plan, states.length);
    return await executeBatchItems(states, questions, plan);
  }
  finally {
    clearBatchRun();
  }
}

export async function executeSubmitBatch(): Promise<void> {
  const errorLine = getElement('errorLine');
  errorLine.textContent = '';
  const input = parseBatchInput();
  if (!input.isValid) {
    errorLine.textContent = input.errorMessage;
    return;
  }
  const failures = await executeBatch(input.states, input.questions);
  if (failures.length > 0)
    alert(formatBatchFailures(failures));
}

export function executeSubmitForMode(): Promise<void> {
  if (pageState.isBatchOn)
    return executeSubmitBatch();
  return executeSubmit();
}
