import { test, expect } from 'bun:test';
import { getBatchSubmitText, formatBatchSubmitText, refreshBatchControls } from './batchControls';
import {
    getBatchOnDisabledIds, getNormalStateText, getVersionTwo, getVersionWithResults,
    installFakeDom, installStubEditors, listEnabled, resetFakeDomAndPageState,
} from './batchControlsFakeDom';
import { pageState } from '../page/state';

function validateSubmitTextFollowsTheModeAndTheRunProgress() {
    expect(formatBatchSubmitText(false, null)).toBe('Submit (paid)');
    expect(formatBatchSubmitText(true, null)).toBe(getBatchSubmitText());
    expect(getBatchSubmitText()).toBe('Submit Batch (paid)');
    expect(formatBatchSubmitText(false, { item: 2, count: 5 })).toBe('running 2 of 5');
}

function validateRunsDisableEverythingIncludingTheToggleAndShowProgress() {
    // Step: a run is active on item 2 of 5 and batch is off.
    const elements = installFakeDom(true);
    installStubEditors(getNormalStateText());
    pageState.versions = [getVersionWithResults(), getVersionTwo()];
    pageState.batchRun = { item: 2, count: 5 };
    refreshBatchControls();
    // Step: all listed controls, the toggle and the submit button are disabled, the button shows the progress.
    expect(listEnabled(elements, getBatchOnDisabledIds())).toEqual([]);
    expect(elements.batchCheckbox.disabled).toBe(true);
    expect(elements.submitButton.disabled).toBe(true);
    expect(elements.submitButton.textContent).toBe('running 2 of 5');
    resetFakeDomAndPageState();
}

function validateEndOfRunReturnsEverythingToNormal() {
    // Step: a run was active, then the run ends.
    const elements = installFakeDom(true);
    installStubEditors(getNormalStateText());
    pageState.versions = [getVersionWithResults(), getVersionTwo()];
    pageState.batchRun = { item: 2, count: 5 };
    refreshBatchControls();
    pageState.batchRun = null;
    refreshBatchControls();
    // Step: everything returns to normal.
    expect(elements.batchCheckbox.disabled).toBe(false);
    expect(elements.submitButton.disabled).toBe(false);
    expect(elements.submitButton.textContent).toBe('Submit (paid)');
    expect(elements.saveButton.disabled).toBe(false);
    resetFakeDomAndPageState();
}

test('test_submit_text_follows_the_mode_and_the_run_progress', validateSubmitTextFollowsTheModeAndTheRunProgress);
test('test_runs_disable_everything_including_the_toggle_and_show_progress', validateRunsDisableEverythingIncludingTheToggleAndShowProgress);
test('test_end_of_run_returns_everything_to_normal', validateEndOfRunReturnsEverythingToNormal);
