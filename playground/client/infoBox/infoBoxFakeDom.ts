import type { Version } from '../../history/playgroundHistory';
import { graphState } from '../graphs/graphState';
import { renderGraphs } from '../graphs/graphs';
import { attachInfoBox } from './infoBox';
import { pageState } from '../page/state';

export class FakeElement {
    public name = '';
    public className = '';
    public textContent = '';
    public title = '';
    public type = '';
    public checked = false;
    public clientHeight = 200;
    public attrs: Record<string, string> = {};
    public children: FakeElement[] = [];
    public listeners: Record<string, () => void> = {};
    public classList = { add: (className: string) => className };
    public setAttribute(key: string, value: string) {
        this.attrs[key] = value;
    }
    public removeAttribute(key: string) {
        delete this.attrs[key];
    }
    public appendChild(child: FakeElement) {
        this.children.push(child);
    }
    public replaceChildren(...children: FakeElement[]) {
        this.children = children;
    }
    public addEventListener(type: string, listener: () => void) {
        this.listeners[type] = listener;
    }
    // The code under test calls the DOM method name querySelector.
    // eslint-disable-next-line no-restricted-syntax
    public querySelector(selector: string): FakeElement | null {
        const wanted = selector.slice(1);
        for (const child of this.children) {
            const isMatch = child.className === wanted || child.attrs.class === wanted;
            if (isMatch)
                return child;
        }
        return null;
    }
    public remove() {
        this.name = 'removed';
    }
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

export function removeFakeDocument() {
    Reflect.deleteProperty(globalThis, 'document');
    graphState.averageShownByName = {};
    pageState.versions = [];
}

export function getNoulVersion(): Version {
    return {
        time: 'now', state: {}, calls: 1, questions: { q: { type: 'noul', criteria: { true: 'is yes' } } },
        outputs: [{ model: 'm', answers: { q: { type: 'noul', noul: 0.8 } }, usage: { input_tokens: 1, output_tokens: 1 } }],
    };
}

export function getLowNoulVersion(): Version {
    return {
        ...getNoulVersion(),
        outputs: [{ model: 'm', answers: { q: { type: 'noul', noul: 0.07 } }, usage: { input_tokens: 1, output_tokens: 1 } }],
    };
}

export function renderNoulBlock(version: Version = getNoulVersion()): FakeElement {
    Object.assign(globalThis, { document: { createElementNS: createFakeElementNamed, createElement: createFakeTag, createTextNode: createFakeText } });
    pageState.versions = [version];
    pageState.index = 0;
    const container = new FakeElement();
    renderGraphs(version, container as unknown as HTMLElement, attachInfoBox);
    return container.children[0];
}

export function listByName(nodes: FakeElement[], name: string): FakeElement[] {
    const found: FakeElement[] = [];
    for (const node of nodes) {
        if (node.name === name)
            found.push(node);
    }
    return found;
}
