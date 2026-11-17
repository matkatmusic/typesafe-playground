import { refreshSubmitAvailability } from '../keys/apiKey';
import { refreshBothEditorLints } from '../backticks/backtickEditors';
import { getButton, getInput } from '../page/dom';
import { refreshFileView } from '../page/fileView';
import { applyPinButtons } from '../pins/pinButtons';
import { isBatchLocked, pageState } from '../page/state';
import { SUBMIT_TEXT } from '../runs/submit';
import type { BatchRun } from '../page/types';
import { updateVersionArrows } from '../versions/versionArrows';
import { refreshVersionBox } from '../versions/versionBox';

export const BATCH_SUBMIT_TEXT = 'Submit Batch (paid)';
export const LOCKED_BUTTON_IDS = ['newButton', 'openButton', 'saveButton', 'reportButton', 'resetRunsButton', 'stateNotesButton', 'questionsNotesButton'];

export function formatBatchSubmitText(isBatchOn: boolean, batchRun: BatchRun | null): string {
  if (batchRun !== null)
    return `running ${batchRun.item} of ${batchRun.count}`;
  if (isBatchOn)
    return BATCH_SUBMIT_TEXT;
  return SUBMIT_TEXT;
}

export function refreshBatchControls(): void {
  const isLocked = isBatchLocked();
  for (const id of LOCKED_BUTTON_IDS)
    getButton(id).disabled = isLocked;
  getInput('batchCheckbox').disabled = pageState.batchRun !== null;
  refreshFileView();
  updateVersionArrows();
  applyPinButtons();
  refreshVersionBox();
  refreshSubmitAvailability();
  getButton('submitButton').textContent = formatBatchSubmitText(pageState.isBatchOn, pageState.batchRun);
}

export function applyBatchMode(isOn: boolean): void {
  pageState.isBatchOn = isOn;
  getInput('batchCheckbox').checked = isOn;
  refreshBatchControls();
  refreshBothEditorLints();
}

export function toggleBatchMode(): void {
  applyBatchMode(getInput('batchCheckbox').checked);
}
