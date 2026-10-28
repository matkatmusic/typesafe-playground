import { test, expect, afterEach } from 'bun:test';
import type { Version } from '../playgroundHistory';
import { graphState } from './graphState';
import { renderGraphs } from './graphs';
import { attachInfoBox } from './infoBox';
import { pageState } from './state';

class FakeElement {
  name = '';
  className = '';
  textContent = '';
  title = '';
  type = '';
  checked = false;
  clientHeight = 200;
  attrs: Record<string, string> = {};
  children: FakeElement[] = [];
  listeners: Record<string, () => void> = {};
  classList = { add: (className: string) => className };
  setAttribute(key: string, value: string) { this.attrs[key] = value; }
  removeAttribute(key: string) { delete this.attrs[key]; }
  appendChild(child: FakeElement) { this.children.push(child); }
  replaceChildren(...children: FakeElement[]) { this.children = children; }
  addEventListener(type: string, listener: () => void) { this.listeners[type] = listener; }
  querySelector(selector: string): FakeElement | null {
    const wanted = selector.slice(1);
    for (const child of this.children) {
      const isMatch = child.className === wanted || child.attrs.class === wanted;
      if (isMatch)
        return child;
    }
    return null;
  }
  remove() { this.name = 'removed'; }
}

function createFakeElementNamed(namespace: string, name: string) {
  const element = new FakeElement();
  element.name = name;
  return element;
}

function createFakeTag(tag: string) {
  return createFakeElementNamed('', tag);
}

function createFakeText(text: string) {
  const element = new FakeElement();
  element.textContent = text;
  return element;
}

function removeFakeDocument() {
  Reflect.deleteProperty(globalThis, 'document');
  graphState.averageShownByName = {};
  pageState.versions = [];
}

const usage = { input_tokens: 1, output_tokens: 1 };
const noulVersion: Version = {
  id: 1, time: 'now', state: null, calls: 1, questions: { q: { type: 'noul', criteria: { true: 'is yes' } } },
  outputs: [{ model: 'm', answers: { q: { type: 'noul', noul: 0.8 } }, usage }],
};

function drawNoulBlock(): FakeElement {
  Object.assign(globalThis, { document: { createElementNS: createFakeElementNamed, createElement: createFakeTag, createTextNode: createFakeText } });
  pageState.versions = [noulVersion];
  pageState.index = 0;
  const container = new FakeElement();
  renderGraphs(noulVersion, container as unknown as HTMLElement, attachInfoBox);
  return container.children[0];
}

function listByName(nodes: FakeElement[], name: string): FakeElement[] {
  const found: FakeElement[] = [];
  for (const node of nodes) {
    if (node.name === name)
      found.push(node);
  }
  return found;
}

function validateNoulHoverDoesNotThrowAndShowsTheValue() {
  const block = drawNoulBlock();
  const svg = block.children[1].children[0];
  const hits: FakeElement[] = [];
  for (const child of svg.children) {
    if (child.attrs.fill === 'transparent')
      hits.push(child);
  }
  expect(hits.length).toBe(1);
  const defaultBox = block.children[2];
  expect(defaultBox.className).toBe('bar-info');
  expect(defaultBox.children.length).toBe(10);
  expect(defaultBox.children[1].children[0].textContent).toBe('yes');
  expect(hits[0].attrs.stroke).toBe('hotpink');
  hits[0].listeners.mouseenter();
  expect(hits[0].attrs.stroke).toBe('hotpink');
  const labels = listByName(svg.children, 'g');
  expect(labels.length).toBe(1);
  expect(labels[0].children[0].textContent).toBe('0.800');
  const shownBox = block.children[block.children.length - 1];
  expect(shownBox.children.length).toBe(10);
  expect(shownBox.children[9].children[0].children[0].textContent).toBe('is yes');
}

function validateAverageAddsAnAverageHitRectFirst() {
  graphState.averageShownByName.q = true;
  const block = drawNoulBlock();
  const svg = block.children[1].children[0];
  const hits: FakeElement[] = [];
  for (const child of svg.children) {
    if (child.attrs.fill === 'transparent')
      hits.push(child);
  }
  expect(hits.length).toBe(2);
}

afterEach(removeFakeDocument);
test('test_noul_hover_does_not_throw_and_shows_the_value', validateNoulHoverDoesNotThrowAndShowsTheValue);
test('test_average_adds_an_average_hit_rect', validateAverageAddsAnAverageHitRectFirst);
