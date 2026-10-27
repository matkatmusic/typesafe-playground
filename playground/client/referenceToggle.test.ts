import { test, expect, afterEach, mock, spyOn } from 'bun:test';
import type { Version } from '../playgroundHistory';
import * as dom from './dom';
import { graphState } from './graphState';
import * as graphs from './graphs';
import * as state from './state';
import * as winnersDom from './winnersDom';
import { updateReferencesReplaced } from './referenceToggle';

afterEach(removeFakeState);

function removeFakeState() {
  mock.restore();
  graphState.isReferencesReplaced = false;
}

function validateTheToggleSetsGraphStateAndRedrawsTheShownVersion() {
  const container = { id: 'container' } as unknown as HTMLElement;
  const checkbox = { checked: true } as unknown as HTMLInputElement;
  const version = { id: 1 } as unknown as Version;
  spyOn(dom, 'getInput').mockReturnValue(checkbox);
  spyOn(dom, 'getElement').mockReturnValue(container);
  spyOn(state, 'getShownVersion').mockReturnValue(version);
  const renderSpy = spyOn(graphs, 'renderGraphs').mockImplementation(() => {});
  const winnersSpy = spyOn(winnersDom, 'renderWinners').mockImplementation(() => {});
  updateReferencesReplaced();
  expect(graphState.isReferencesReplaced).toBe(true);
  expect(renderSpy.mock.calls.length).toBe(1);
  expect(renderSpy.mock.calls[0].slice(0, 2)).toEqual([version, container]);
  expect(winnersSpy.mock.calls).toEqual([[version, container]]);
  Object.assign(checkbox, { checked: false });
  updateReferencesReplaced();
  expect(graphState.isReferencesReplaced).toBe(false);
}

test('test_the_toggle_sets_graph_state_and_redraws_the_shown_version', validateTheToggleSetsGraphStateAndRedrawsTheShownVersion);
