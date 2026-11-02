import type { Version } from '../playgroundHistory';
import { applyBatchMode, refreshBatchControls } from './batchControls';
import { buildBatchVersions, computeBatchStateError, formatBatchFailures } from './batchPlan';
import { renderTotalCost } from './costTokens';
import { getElement } from './dom';
import { sendDraft } from './draftSync';
import { getQuestionsEditor, getStateEditor } from './editors';
import { computeJsonParseResult } from './jsonParse';
import { isKindTextEdited } from './noteKind';
import { markPageChanged } from './pageChanged';
import { saveVersionNote } from './saveVersionNote';
import { buildEmptyPendingNotes, getShownVersion, pageState } from './state';
import { buildRunBody, executeSubmit, formatRunFailure, sendRun, setEditorsLocked } from './submit';
import type { RunResult } from './types';
import { sendJson } from './versionActions';
import { renderShownVersion } from './versionBox';

export async function executeSubmitBatch(): Promise<void> {
  const errorLine = getElement('errorLine');
  errorLine.textContent = '';
  const stateResult = computeJsonParseResult('state', getStateEditor().state.doc.toString());
  if (!stateResult.isValid) {
    errorLine.textContent = stateResult.errorMessage;
    return;
  }
  const batchError = computeBatchStateError(stateResult.value);
  if (batchError !== null) {
    errorLine.textContent = batchError;
    return;
  }
  const questionsResult = computeJsonParseResult('questions', getQuestionsEditor().state.doc.toString());
  if (!questionsResult.isValid) {
    errorLine.textContent = questionsResult.errorMessage;
    return;
  }
  const states = stateResult.value as unknown[];
  const questions = questionsResult.value;
  const shownVersion = getShownVersion();
  const isQuestionsUnchanged = !isKindTextEdited('questions');
  const oldVersionCount = pageState.versions.length;
  const failures: string[] = [];
  setEditorsLocked(true);
  try {
    const plan = buildBatchVersions(pageState.versions, pageState.index, states, questions);
    const openResponse = await sendJson('/open', { versions: plan.versions });
    const opened: { versions: Version[] } = await openResponse.json();
    pageState.versions = opened.versions;
    markPageChanged('last edited');
    const questionsNote = shownVersion.questionsNote;
    if (isQuestionsUnchanged) {
      if (questionsNote !== undefined) {
        for (const index of plan.itemIndexes) {
          const isNewVersion = index >= oldVersionCount;
          if (isNewVersion)
            await saveVersionNote(pageState.versions[index], { kind: 'questions' }, questionsNote);
        }
      }
    }
    pageState.editedDraft = null;
    pageState.pendingNotes = buildEmptyPendingNotes();
    pageState.index = plan.itemIndexes[0];
    pageState.batchRun = { item: 1, count: states.length };
    applyBatchMode(false);
    renderShownVersion();
    await sendDraft();
    for (let i = 0; i < states.length; i++) {
      pageState.batchRun = { item: i + 1, count: states.length };
      refreshBatchControls();
      const runBody = { ...buildRunBody(states[i], questions), index: plan.itemIndexes[i] };
      const response = await sendRun(runBody);
      if (!response.ok) {
        failures.push(`version ${plan.itemIndexes[i] + 1}: ${formatRunFailure(response.status, await response.text())}`);
        continue;
      }
      const result: RunResult = await response.json();
      pageState.versions[result.index] = result.version;
      markPageChanged('last run');
      const isShownVersionRun = result.index === pageState.index;
      if (isShownVersionRun)
        renderShownVersion();
      else
        renderTotalCost();
    }
  }
  finally {
    pageState.batchRun = null;
    setEditorsLocked(false);
    refreshBatchControls();
  }
  if (failures.length > 0)
    alert(formatBatchFailures(failures));
}

export function executeSubmitForMode(): Promise<void> {
  if (pageState.isBatchOn)
    return executeSubmitBatch();
  return executeSubmit();
}
