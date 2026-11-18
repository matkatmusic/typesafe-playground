import type { Version } from '../../history/playgroundHistory';
import { graphState } from '../graphs/graphState';

export class FakeElement {
    public id = '';
    public className = '';
    public textContent = '';
    public title = '';
    public children: FakeElement[] = [];
    public listeners: Record<string, () => void> = {};
    public addEventListener(type: string, listener: () => void) {
        this.listeners[type] = listener;
    }
    public appendChild(child: FakeElement) {
        this.children.push(child);
    }
    public replaceChildren(...nodes: FakeElement[]) {
        this.children = nodes;
    }
}

function createFakeText(text: string) {
    const element = new FakeElement();
    element.textContent = text;
    return element;
}

export function installFakeDocument() {
    Object.assign(globalThis, { document: { createElement: () => new FakeElement(), createTextNode: createFakeText } });
}

function removeFakeDocument() {
    Reflect.deleteProperty(globalThis, 'document');
}

export function removeFakeState() {
    removeFakeDocument();
    graphState.isReferencesReplaced = false;
}

export function readLineText(line: FakeElement): string {
    let text = '';
    for (const part of line.children)
        text += part.textContent;
    return text;
}

export function buildVersion(questions: unknown, outputs: unknown[]): Version {
    return { id: 1, time: 't', state: {}, questions, calls: outputs.length, outputs } as Version;
}

export function getNoulQuestions() {
    return { q: { type: 'noul', instructions: 'Is it?', criteria: { true: 'yes!', false: 'no!' } } };
}

export function buildNoulOutputs(...noulValues: number[]) {
    const outputs = [];
    for (const noul of noulValues)
        outputs.push({ model: 'm', answers: { q: { type: 'noul', noul } }, usage: { input_tokens: 1, output_tokens: 1 } });
    return outputs;
}
