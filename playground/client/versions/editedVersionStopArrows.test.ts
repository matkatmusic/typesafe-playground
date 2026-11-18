import { describe, test, expect, afterEach } from 'bun:test';
import { pageState } from '../page/state';
import { updateVersionArrows } from './versionArrows';
import { moveToNextVersion, moveToPreviousVersion } from './versionBox';
import { getIsoTime, installOneVersionWithAnEditedState, removeFakeState } from './editedVersionStopSetup';

function validateOneVersionPlusAnEditKeepsTheArrowsEnabledAndBothStopsReachable() {
    const { elements, texts } = installOneVersionWithAnEditedState();
    updateVersionArrows();
    expect(elements.prevVersionButton.disabled).toBe(false);
    expect(elements.nextVersionButton.disabled).toBe(false);
    moveToPreviousVersion();
    expect(pageState.index).toBe(0);
    expect(elements.versionLabel.textContent).toBe(`version 1 of 2 · ${new Date(getIsoTime()).toLocaleString()} · 1 call`);
    expect(texts.state).toBe('{"a":1}');
    expect(elements.prevVersionButton.disabled).toBe(false);
    moveToNextVersion();
    expect(pageState.index).toBe(0);
    expect(elements.versionLabel.textContent).toBe('version 2 of 2 · not run yet · 0 calls');
    expect(texts.state).toBe('{"a": 2}');
}

function registerEditedVersionStopArrowsTests() {
    afterEach(removeFakeState);
    test('test_one_version_plus_an_edit_keeps_the_arrows_enabled_and_both_stops_reachable', validateOneVersionPlusAnEditKeepsTheArrowsEnabledAndBothStopsReachable);
}

describe('editedVersionStopArrows', registerEditedVersionStopArrowsTests);
