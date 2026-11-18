import { test, expect } from 'bun:test';
import { applyBatchMode, refreshBatchControls } from './batchControls';
import {
    getBatchOnDisabledIds, getNormalStateText, getVersionTwo, getVersionWithResults, getDispatchedSpecs,
    installFakeDom, installStubEditors, listEnabled, resetFakeDomAndPageState,
} from './batchControlsFakeDom';
import { pageState } from '../page/state';
import { moveByVersions } from '../versions/versionBox';

function validateBatchOnDisablesEveryListedControlAndKeepsSubmitUsable() {
    // Step: two versions with results, a file open, one version pinned, an env key present.
    const elements = installFakeDom(true);
    installStubEditors(getNormalStateText());
    Object.assign(pageState, { versions: [getVersionWithResults(), getVersionTwo()], fileHandle: {} as FileSystemFileHandle, pinnedIndex: 1 });
    // Step: before batch, every listed control is enabled (pin: the shown version is not the pinned one).
    refreshBatchControls();
    expect(listEnabled(elements, getBatchOnDisabledIds()).sort()).toEqual([...getBatchOnDisabledIds()].sort());
    // Step: turn batch on.
    applyBatchMode(true);
    // Step: every listed control is disabled, the toggle and the submit button are usable.
    expect(listEnabled(elements, getBatchOnDisabledIds())).toEqual([]);
    expect(elements.batchCheckbox.disabled).toBe(false);
    expect(elements.batchCheckbox.checked).toBe(true);
    expect(elements.submitButton.disabled).toBe(false);
    expect(elements.submitButton.textContent).toBe('Submit Batch (paid)');
    resetFakeDomAndPageState();
}

function validateBatchOnStopsTheArrowKeysFromMoving() {
    installFakeDom(true);
    installStubEditors(getNormalStateText());
    pageState.versions = [getVersionWithResults(), getVersionTwo()];
    pageState.index = 0;
    pageState.isBatchOn = true;
    moveByVersions(1);
    expect(pageState.index).toBe(0);
    resetFakeDomAndPageState();
}

function validateToggleSendsTheRelintEffectToBothEditors() {
    installFakeDom(true);
    installStubEditors(getNormalStateText());
    pageState.versions = [getVersionWithResults()];
    applyBatchMode(true);
    expect(getDispatchedSpecs().length).toBe(2);
    applyBatchMode(false);
    expect(getDispatchedSpecs().length).toBe(4);
    resetFakeDomAndPageState();
}

test('test_batch_on_disables_every_listed_control_and_keeps_submit_usable', validateBatchOnDisablesEveryListedControlAndKeepsSubmitUsable);
test('test_batch_on_stops_the_arrow_keys_from_moving', validateBatchOnStopsTheArrowKeysFromMoving);
test('test_toggle_sends_the_relint_effect_to_both_editors', validateToggleSendsTheRelintEffectToBothEditors);
