import { test, expect } from 'bun:test';
import { graphState } from './graphState';

function validateGraphStateStartsEmpty() {
  expect(graphState.averageShownByName).toEqual({});
  expect(graphState.collapsedByName).toEqual({});
}

test('test_graph_state_starts_empty', validateGraphStateStartsEmpty);
