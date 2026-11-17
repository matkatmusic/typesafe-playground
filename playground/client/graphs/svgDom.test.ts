import { test, expect, afterEach } from 'bun:test';
import { createSvgNode, SVG_NAMESPACE } from './svgDom';

function createFakeNode(namespace: string, name: string) {
  const attrs: Record<string, string> = {};
  return { namespace, name, attrs, textContent: '', setAttribute(key: string, value: string) { attrs[key] = value; } };
}

function removeFakeDocument() {
  Reflect.deleteProperty(globalThis, 'document');
}

function validateNodeGetsNamespaceAttributesAndText() {
  Object.assign(globalThis, { document: { createElementNS: createFakeNode } });
  const node = createSvgNode('text', { x: 4, class: 'a' }, 'hello') as unknown as ReturnType<typeof createFakeNode>;
  expect(node.namespace).toBe(SVG_NAMESPACE);
  expect(node.name).toBe('text');
  expect(node.attrs).toEqual({ x: '4', class: 'a' });
  expect(node.textContent).toBe('hello');
}

function validateNodeWithoutTextKeepsEmptyText() {
  Object.assign(globalThis, { document: { createElementNS: createFakeNode } });
  const node = createSvgNode('g', {}) as unknown as ReturnType<typeof createFakeNode>;
  expect(node.textContent).toBe('');
}

afterEach(removeFakeDocument);
test('test_svg_node_gets_namespace_attributes_and_text', validateNodeGetsNamespaceAttributesAndText);
test('test_svg_node_without_text_keeps_empty_text', validateNodeWithoutTextKeepsEmptyText);
