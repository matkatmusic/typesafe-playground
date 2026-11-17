import { test, expect, afterEach } from 'bun:test';
import { graphState } from './graphState';
import { setAllGraphsCollapsed, setAllGraphsToCollapsed, setAllGraphsToExpanded, updateCollapsedNames } from './collapseActions';

function clearCollapsedNames() {
  graphState.collapsedByName = {};
}

function validateCollapseSetsEveryName() {
  updateCollapsedNames(['a', 'b'], true);
  expect(graphState.collapsedByName).toEqual({ a: true, b: true });
}

function validateExpandOverwritesAndKeepsOtherNames() {
  graphState.collapsedByName = { a: true, b: true, other: true };
  updateCollapsedNames(['a', 'b'], false);
  expect(graphState.collapsedByName).toEqual({ a: false, b: false, other: true });
}

function validateModuleLoadsWithoutDom() {
  expect(typeof setAllGraphsCollapsed).toBe('function');
  expect(typeof setAllGraphsToCollapsed).toBe('function');
  expect(typeof setAllGraphsToExpanded).toBe('function');
}

afterEach(clearCollapsedNames);
test('test_collapse_sets_every_name', validateCollapseSetsEveryName);
test('test_expand_overwrites_and_keeps_other_names', validateExpandOverwritesAndKeepsOtherNames);
test('test_collapse_actions_module_loads_without_touching_the_dom', validateModuleLoadsWithoutDom);
