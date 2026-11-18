import { test, expect } from 'bun:test';
import { getLockedButtonIds } from './batchControls';
import { createElements, installDocumentGlobals } from './submitBatchHarnessElements';

function validateCreateElementsStoresKeyFlagInDataBox() {
    // Step: build the elements with an env key.
    const elements = createElements(true);
    // Step: the data box holds an empty version list and the key flag.
    expect(JSON.parse(elements.data.textContent)).toEqual({ versions: [], hasEnvKey: true });
}

function validateCreateElementsSetsDefaultInputs() {
    // Step: build the elements without an env key.
    const elements = createElements(false);
    // Step: the calls picker is 3 and the batch checkbox is checked.
    expect(elements.callsPicker.value).toBe('3');
    expect(elements.batchCheckbox.checked).toBe(true);
}

function validateCreateElementsBuildsEveryButton() {
    // Step: build the elements.
    const elements = createElements(false);
    // Step: every locked button id and the extra buttons exist.
    const expectedIds = [...getLockedButtonIds(), 'resetButton', 'submitButton', 'prevVersionButton', 'nextVersionButton', 'deleteVersionButton', 'pinButton', 'unpinButton'];
    for (const id of expectedIds)
        expect(elements[id]).toBeDefined();
}

function validateInstallDocumentGlobalsFindsElementsById() {
    // Step: install the globals for a fresh set of elements.
    const elements = createElements(false);
    installDocumentGlobals(elements);
    // Step: the fake document returns a known element and null for an unknown id.
    expect(document.getElementById('submitButton')).toBe(elements.submitButton as unknown as HTMLElement);
    expect(document.getElementById('missingId')).toBeNull();
}

test('createElements stores the key flag in the data box', validateCreateElementsStoresKeyFlagInDataBox);
test('createElements sets the default inputs', validateCreateElementsSetsDefaultInputs);
test('createElements builds every button', validateCreateElementsBuildsEveryButton);
test('installDocumentGlobals finds elements by id', validateInstallDocumentGlobalsFindsElementsById);
