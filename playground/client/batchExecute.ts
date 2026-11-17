import type { Version } from '../playgroundHistory';
import { applyBatchMode, refreshBatchControls } from './batchControls';
import { buildBatchVersions } from './batchPlan';
import type { BatchVersions } from './batchPlan';
import { renderTotalCost } from './costTokens';
import { sendDraft } from './draftSync';
import type { JsonValue, Questions } from '@typesafe-ai/sdk';
import { isKindTextEdited } from './noteKind';
import { markPageChanged } from './pageChanged';
import { saveVersionNote } from './saveVersionNote';
import { buildEmptyPendingNotes, getShownVersion, pageState } from './state';
// import { buildRunBody, executeSubmit, formatRunFailure, sendRun, setEditorsLocked } from './submit';
// import { buildRunBody, executeSubmit, formatRunFailure, listSubmitErrors, sendRun, setEditorsLocked } from './submit';
import { buildRunBody, formatRunFailure, sendRun, setEditorsLocked } from './submit';
import type { RunResult } from './types';
import { sendJson } from './versionActions';
import { renderShownVersion } from './versionBox';

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

export async function executeBatch(states: Record<string, JsonValue>[], questions: Questions): Promise<string[]> {
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
