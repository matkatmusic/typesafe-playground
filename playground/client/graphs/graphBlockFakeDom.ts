import { mock } from 'bun:test';
import type { Version } from '../../history/playgroundHistory';
import { graphState } from './graphState';

function createFakeElementFields() {
    return {
        id: '', scrollTop: 0, className: '', textContent: '', title: '', type: '', checked: false,
        children: [] as unknown[], classes: [] as string[], attrs: {} as Record<string, string>, listeners: {} as Record<string, () => void>,
    };
}

function createFakeElementAttributeWriters(fields: ReturnType<typeof createFakeElementFields>) {
    return {
        classList: { add(name: string) {
            fields.classes.push(name);
        } },
        setAttribute(key: string, value: string) {
            fields.attrs[key] = value;
        },
    };
}

function createFakeElementChildWriters(fields: ReturnType<typeof createFakeElementFields>) {
    return {
        appendChild(child: unknown) {
            fields.children.push(child);
        },
        addEventListener(type: string, listener: () => void) {
            fields.listeners[type] = listener;
        },
    };
}

export function createFakeElement() {
    const fields = createFakeElementFields();
    return { ...fields, scrollIntoView(_options: unknown) {}, ...createFakeElementAttributeWriters(fields), ...createFakeElementChildWriters(fields) };
}

export type FakeElement = ReturnType<typeof createFakeElement>;

function createFakeText(text: string) {
    const element = createFakeElement();
    element.textContent = text;
    return element;
}

class FakeElementRegistry {
    private static instance: FakeElementRegistry | undefined;
    public readonly elementsById: Record<string, FakeElement> = {};
    private constructor() {}
    public static getInstance() {
        FakeElementRegistry.instance ??= new FakeElementRegistry();
        return FakeElementRegistry.instance;
    }
}

export function getFakeElementById(id: string) {
    const { elementsById } = FakeElementRegistry.getInstance();
    elementsById[id] ??= createFakeElement();
    return elementsById[id];
}

export function installFakeDocument() {
    Object.assign(globalThis, { document: { createElement: createFakeElement, createTextNode: createFakeText, getElementById: getFakeElementById } });
}

export function removeFakeDocument() {
    mock.restore();
    Reflect.deleteProperty(globalThis, 'document');
    const { elementsById } = FakeElementRegistry.getInstance();
    for (const id of Object.keys(elementsById))
        Reflect.deleteProperty(elementsById, id);
    graphState.collapsedByName = {};
    graphState.isReferencesReplaced = false;
}

export function getVersion(): Version {
    return { time: 'now', state: {}, questions: {}, calls: 0, outputs: [] };
}

export function executeNothing() {}
