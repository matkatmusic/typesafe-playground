import { test, expect, afterEach } from 'bun:test';
import { removeValueLabels, renderValueLabels } from './infoLabels';

function createFakeNode(namespace: string, name: string) {
  const attrs: Record<string, string> = {};
  const children: unknown[] = [];
  return { name, attrs, children, textContent: '', setAttribute(key: string, value: string) { attrs[key] = value; }, appendChild(child: unknown) { children.push(child); } };
}

type FakeNode = ReturnType<typeof createFakeNode>;

function removeFakeDocument() {
  Reflect.deleteProperty(globalThis, 'document');
}

function drawLabels(isAverageShown: boolean): FakeNode {
  Object.assign(globalThis, { document: { createElementNS: createFakeNode } });
  const appended: FakeNode[] = [];
  const svg = { appendChild(child: FakeNode) { appended.push(child); } };
  renderValueLabels(svg as unknown as Element, [0.2, 0.6], 100, 100, isAverageShown);
  return appended[0];
}

function validateLabelsHoldEachCallValue() {
  const group = drawLabels(false);
  expect(group.attrs.class).toBe('value-labels');
  expect(group.attrs['pointer-events']).toBe('none');
  expect(group.children.length).toBe(2);
  expect((group.children[0] as FakeNode).textContent).toBe('0.200');
  expect((group.children[1] as FakeNode).textContent).toBe('0.600');
}

function validateAverageAddsAFirstLabel() {
  const group = drawLabels(true);
  expect(group.children.length).toBe(3);
  expect((group.children[0] as FakeNode).textContent).toBe('0.400');
}

function validateRemoveTakesTheGroupOut() {
  let removeCount = 0;
  function removeGroup() {
    removeCount++;
  }
  const svgWithGroup = { querySelector() { return { remove: removeGroup }; } };
  const svgWithout = { querySelector() { return null; } };
  removeValueLabels(svgWithGroup as unknown as Element);
  removeValueLabels(svgWithout as unknown as Element);
  expect(removeCount).toBe(1);
}

afterEach(removeFakeDocument);
test('test_labels_hold_each_call_value', validateLabelsHoldEachCallValue);
test('test_average_adds_a_first_label', validateAverageAddsAFirstLabel);
test('test_remove_takes_the_group_out', validateRemoveTakesTheGroupOut);
