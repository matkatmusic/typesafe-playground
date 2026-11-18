import { test, expect, afterEach, describe } from 'bun:test';
import { applyBatchMode } from './batchControls';
import {
    getNormalStateText, getVersionWithResults, installFakeDom, installStubEditors, listEnabled, resetFakeDomAndPageState,
} from './batchControlsFakeDom';
import { pageState } from '../page/state';

function validateBatchOffReturnsEachControlToItsNormalState() {
    // Step: one version only, no file open, no env key and no typed key.
    const elements = installFakeDom(false);
    installStubEditors(getNormalStateText());
    pageState.versions = [getVersionWithResults()];
    applyBatchMode(true);
    applyBatchMode(false);
    // Step: delete stays off at one version, reset stays off without a file, submit follows the key rule.
    expect(elements.deleteVersionButton.disabled).toBe(true);
    expect(elements.resetButton.disabled).toBe(true);
    expect(elements.prevVersionButton.disabled).toBe(true);
    expect(elements.submitButton.disabled).toBe(true);
    expect(elements.submitButton.textContent).toBe('Submit (paid)');
    expect(listEnabled(elements, ['newButton', 'openButton', 'saveButton', 'reportButton', 'resetRunsButton', 'stateNotesButton', 'questionsNotesButton', 'pinButton'])).toEqual(['newButton', 'openButton', 'saveButton', 'reportButton', 'resetRunsButton', 'stateNotesButton', 'questionsNotesButton', 'pinButton']);
    expect(elements.noteText.disabled).toBe(false);
}

function registerBatchOffTests() {
    afterEach(resetFakeDomAndPageState);
    test('test_batch_off_returns_each_control_to_its_normal_state', validateBatchOffReturnsEachControlToItsNormalState);
}

describe('batch controls with batch off', registerBatchOffTests);
