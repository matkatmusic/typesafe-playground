import { test, expect } from 'bun:test';
import { createSvgNode } from './svgDom';

function createFakeNode(namespace: string, name: string) {
    const attrs: Record<string, string> = {};
    return { namespace, name, attrs, textContent: '', setAttribute(key: string, value: string) {
        attrs[key] = value;
    } };
}

function removeFakeDocument() {
    Reflect.deleteProperty(globalThis, 'document');
}

function validateNodeGetsNamespaceAttributesAndText() {
    Object.assign(globalThis, { document: { createElementNS: createFakeNode } });
    const node = createSvgNode('text', { x: 4, class: 'a' }, 'hello') as unknown as ReturnType<typeof createFakeNode>;
    expect(node.namespace).toBe('http://www.w3.org/2000/svg');
    expect(node.name).toBe('text');
    expect(node.attrs).toEqual({ x: '4', class: 'a' });
    expect(node.textContent).toBe('hello');
    removeFakeDocument();
}

function validateNodeWithoutTextKeepsEmptyText() {
    Object.assign(globalThis, { document: { createElementNS: createFakeNode } });
    const node = createSvgNode('g', {}) as unknown as ReturnType<typeof createFakeNode>;
    expect(node.textContent).toBe('');
    removeFakeDocument();
}

test('test_svg_node_gets_namespace_attributes_and_text', validateNodeGetsNamespaceAttributesAndText);
test('test_svg_node_without_text_keeps_empty_text', validateNodeWithoutTextKeepsEmptyText);
