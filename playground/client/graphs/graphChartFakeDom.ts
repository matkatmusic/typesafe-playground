import type { Answer, GraphBlock } from './graphTypes';
import { renderChart } from './graphChart';
import { graphState } from './graphState';

export function createFakeNode(namespace: string, name: string) {
    const attrs: Record<string, string> = {};
    const children: unknown[] = [];
    return { name, attrs, children, textContent: '', setAttribute(key: string, value: string) {
        attrs[key] = value;
    }, appendChild(child: unknown) {
        children.push(child);
    } };
}

export type FakeNode = ReturnType<typeof createFakeNode>;

export function removeFakeDocument() {
    Reflect.deleteProperty(globalThis, 'document');
    graphState.averageShownByName = {};
}

export function renderNoulChartNodes(): FakeNode[] {
    Object.assign(globalThis, { document: { createElementNS: createFakeNode } });
    const drawn: { svg?: FakeNode } = {};
    function replaceChildren(svg: FakeNode) {
        drawn.svg = svg;
    }
    const graphBlock = { block: {}, box: { clientHeight: 200, replaceChildren } } as unknown as GraphBlock;
    const answers: Answer[] = [{ type: 'noul', noul: 0.8 }];
    renderChart(graphBlock, 'q', { type: 'noul' }, answers, null, ['TypeSafe']);
    return drawn.svg!.children as FakeNode[];
}

export function listByName(nodes: FakeNode[], name: string): FakeNode[] {
    const found: FakeNode[] = [];
    for (const node of nodes) {
        if (node.name === name)
            found.push(node);
    }
    return found;
}
