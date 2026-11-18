import { test, describe, expect, afterEach, mock, spyOn } from 'bun:test';
import type { Version } from '../../history/playgroundHistory';
import * as dom from '../page/dom';
import { graphState } from '../graphs/graphState';
import * as graphs from '../graphs/graphs';
import * as state from '../page/state';
import * as winnersDom from '../runs/winnersDom';
import { updateReferencesReplaced } from './referenceToggle';

function removeFakeState() {
    mock.restore();
    graphState.isReferencesReplaced = false;
}

function executeNothing() {}

function installFakePage(checkbox: HTMLInputElement, container: HTMLElement, version: Version) {
    spyOn(dom, 'getInput').mockReturnValue(checkbox);
    spyOn(dom, 'getElement').mockReturnValue(container);
    spyOn(state, 'getShownVersion').mockReturnValue(version);
}

function installDrawingSpies() {
    const renderSpy = spyOn(graphs, 'renderGraphs').mockImplementation(executeNothing);
    const winnersSpy = spyOn(winnersDom, 'renderWinners').mockImplementation(executeNothing);
    return { renderSpy, winnersSpy };
}

function validateTheToggleSetsGraphStateAndRedrawsTheShownVersion() {
    const container = { id: 'container' } as unknown as HTMLElement;
    const checkbox = { checked: true } as unknown as HTMLInputElement;
    const version = { id: 1 } as unknown as Version;
    installFakePage(checkbox, container, version);
    const { renderSpy, winnersSpy } = installDrawingSpies();
    updateReferencesReplaced();
    expect(graphState.isReferencesReplaced).toBe(true);
    expect(renderSpy.mock.calls.length).toBe(1);
    expect(renderSpy.mock.calls[0].slice(0, 2)).toEqual([version, container]);
    expect(winnersSpy.mock.calls).toEqual([[version, container]]);
    Object.assign(checkbox, { checked: false });
    updateReferencesReplaced();
    expect(graphState.isReferencesReplaced).toBe(false);
}

function registerReferenceToggleTests() {
    afterEach(removeFakeState);
    test('test_the_toggle_sets_graph_state_and_redraws_the_shown_version', validateTheToggleSetsGraphStateAndRedrawsTheShownVersion);
}

describe('referenceToggle', registerReferenceToggleTests);
