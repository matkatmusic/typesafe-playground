import type { Version } from '../../history/playgroundHistory';
import type { ChartLayout } from './graphTypes';
import { graphState } from './graphState';

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
    public classes: string[] = [];
    public listeners: Record<string, () => void> = {};
    public classList = { add: (className: string) => this.classes.push(className) };
    public setAttribute(key: string, value: string) {
        this.attrs[key] = value;
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

export function installFakeDocument() {
    Object.assign(globalThis, { document: { createElementNS: createFakeElementNamed, createElement: createFakeTag, createTextNode: createFakeText, getElementById: createFakeTag } });
}

export function removeFakeDocument() {
    Reflect.deleteProperty(globalThis, 'document');
    graphState.collapsedByName = {};
    graphState.averageShownByName = {};
}

export function createEmptyVersion(): Version {
    return { time: 'now', state: {}, questions: {}, calls: 0, outputs: [] };
}

export function createFilledVersion(): Version {
    const usage = { input_tokens: 1, output_tokens: 1 };
    return { ...createEmptyVersion(), calls: 1, outputs: [{ model: 'm', answers: { q: { type: 'noul', noul: 0.5 } }, usage }] };
}

export function createTwoQuestionsVersion(): Version {
    return { ...createFilledVersion(), questions: { q: { type: 'noul', instructions: 'Is it?' }, other: { type: 'noul' } } };
}

export function createChartRecorder(drawn: ChartLayout[][]) {
    function pushCharts(charts: ChartLayout[]) {
        drawn.push(charts);
    }
    return pushCharts;
}
