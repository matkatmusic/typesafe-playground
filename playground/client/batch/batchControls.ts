import { refreshSubmitAvailability } from '../keys/apiKey';
import { refreshBothEditorLints } from '../backticks/backtickEditors';
import { getButton, getInput } from '../page/dom';
import { refreshFileView } from '../page/fileView';
import { applyPinButtons } from '../pins/pinButtons';
import { isBatchLocked, pageState } from '../page/state';
import { getSubmitText } from '../runs/submit';
import type { BatchRun } from '../page/types';
import { updateVersionArrows } from '../versions/versionArrows';
import { refreshVersionBox } from '../versions/versionBox';

export function getBatchSubmitText(): string {
    return 'Submit Batch (paid)';
}

export function getLockedButtonIds(): string[] {
    return ['newButton', 'openButton', 'saveButton', 'reportButton', 'resetRunsButton', 'stateNotesButton', 'questionsNotesButton'];
}

export function formatBatchSubmitText(isBatchOn: boolean, batchRun: BatchRun | null): string {
    if (batchRun !== null)
        return `running ${batchRun.item} of ${batchRun.count}`;
    if (isBatchOn)
        return getBatchSubmitText();
    return getSubmitText();
}

export function refreshBatchControls(): void {
    const isLocked = isBatchLocked();
    for (const id of getLockedButtonIds())
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
