import { test, expect, afterEach, describe } from 'bun:test';
import { pageState } from '../page/state';
import { executeSubmitBatch } from './submitBatch';
import { getQuestions, buildVersion, installHarness, resetHarness, enableBatch } from './submitBatchHarness.test';
import type { Harness } from './submitBatchHarness.test';

function validateControlsAreNormalAfterTheLastRun(harness: Harness) {
    expect(harness.elements.batchCheckbox.checked).toBe(false);
    expect(harness.elements.batchCheckbox.disabled).toBe(false);
    expect(harness.elements.submitButton.textContent).toBe('Submit (paid)');
    expect(harness.elements.submitButton.disabled).toBe(false);
    expect(harness.elements.newButton.disabled).toBe(false);
    expect(harness.locks[harness.locks.length - 1]).toBe(false);
}

function validateDraftWasSentBeforeTheFirstRun(harness: Harness) {
    // Step: before the first run, the draft was sent with toggle off and the editor's first item state.
    expect(harness.drafts.length).toBe(1);
    expect(harness.drafts[0].isBatch).toBe(false);
    expect(harness.drafts[0].state).toBe(JSON.stringify({ a: 1 }));
    expect(harness.fetchOrder.indexOf('/draft')).toBeLessThan(harness.fetchOrder.indexOf('/run'));
}

async function validateAfterTheLastRunTheToggleIsOffTheControlsAreNormalAndTheDraftIsCleared() {
    const harness = installHarness([buildVersion({ a: 0 }, getQuestions(), 1, 't')], 0, '[{"a":1},{"a":2}]', JSON.stringify(getQuestions()), []);
    enableBatch();
    await executeSubmitBatch();
    expect(pageState.isBatchOn).toBe(false);
    expect(pageState.batchRun).toBeNull();
    validateControlsAreNormalAfterTheLastRun(harness);
    expect(pageState.editedDraft).toBeNull();
    validateDraftWasSentBeforeTheFirstRun(harness);
    expect(harness.elements.lastEditedLabel.textContent.startsWith('last run: ')).toBe(true);
    expect(pageState.isDirty).toBe(true);
}

function registerBatchExecuteAfterLastRunTests() {
    afterEach(resetHarness);
    test('test_after_the_last_run_the_toggle_is_off_the_controls_are_normal_and_the_draft_is_cleared', validateAfterTheLastRunTheToggleIsOffTheControlsAreNormalAndTheDraftIsCleared);
}

describe('batchExecuteAfterLastRun', registerBatchExecuteAfterLastRunTests);
