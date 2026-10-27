import { test, expect, afterEach } from 'bun:test';
import { PINNED_PAD } from './graphGeometry';
import { renderOption } from './graphOption';

function createFakeNode(namespace: string, name: string) {
  const attrs: Record<string, string> = {};
  return { name, attrs, setAttribute(key: string, value: string) { attrs[key] = value; } };
}

function removeFakeDocument() {
  Reflect.deleteProperty(globalThis, 'document');
}

function drawOption(isAverageShown: boolean, isPinned = false) {
  Object.assign(globalThis, { document: { createElementNS: createFakeNode } });
  const nodes: ReturnType<typeof createFakeNode>[] = [];
  const svg = { appendChild(child: ReturnType<typeof createFakeNode>) { nodes.push(child); } };
  renderOption(svg as unknown as Element, [0.2, 0.6], 100, 100, isAverageShown, 0, isPinned);
  return nodes;
}

function validateOneBarPerCallWithoutAverage() {
  const nodes = drawOption(false);
  expect(nodes.length).toBe(2);
  expect(nodes[0].attrs.fill).toBe('var(--score)');
}

function validateAverageAddsBarAndRangeLine() {
  const nodes = drawOption(true);
  expect(nodes.length).toBe(4);
  expect(nodes[0].attrs.fill).toBe('var(--confidence)');
  expect(nodes[1].name).toBe('line');
}

function validatePinnedBarsAreMutedAndWiderThanCurrentBars() {
  const current = drawOption(false)[0];
  const pinned = drawOption(false, true)[0];
  expect(pinned.attrs.fill).toBe('var(--text-muted)');
  expect(pinned.attrs.opacity).toBe('0.35');
  expect(current.attrs.opacity).toBe('1');
  expect(Number(pinned.attrs.x)).toBe(Number(current.attrs.x) - PINNED_PAD);
  expect(Number(pinned.attrs.width)).toBe(Number(current.attrs.width) + 2 * PINNED_PAD);
  expect(pinned.attrs.y).toBe(current.attrs.y);
  expect(pinned.attrs.height).toBe(current.attrs.height);
}

afterEach(removeFakeDocument);
test('test_pinned_bars_are_muted_and_wider_than_current_bars', validatePinnedBarsAreMutedAndWiderThanCurrentBars);
test('test_option_draws_one_bar_per_call_without_average', validateOneBarPerCallWithoutAverage);
test('test_option_with_average_adds_bar_and_range_line', validateAverageAddsBarAndRangeLine);
