import { mock, spyOn } from 'bun:test';
import type { EditorView } from '@codemirror/view';
import * as editors from '../editors/editors';
import { pageState } from '../page/state';

class RealFetchHolder {
    private static instance: RealFetchHolder | undefined;
    public readonly realFetch = globalThis.fetch;
    private constructor() {}
    public static getInstance() {
        RealFetchHolder.instance ??= new RealFetchHolder();
        return RealFetchHolder.instance;
    }
}

export function getSessionId() {
    return '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
}

export function removeFakeState() {
    mock.restore();
    Reflect.deleteProperty(globalThis, 'document');
    Reflect.deleteProperty(globalThis, 'sessionStorage');
    globalThis.fetch = RealFetchHolder.getInstance().realFetch;
    pageState.isDirty = false;
}

function buildStubEditor(texts: { value: string }) {
    return { state: { doc: { toString: () => texts.value } } } as unknown as EditorView;
}

export function installStubEditors(stateText: string, questionsText: string) {
    const stateTexts = { value: stateText };
    const questionsTexts = { value: questionsText };
    const stateEditor = buildStubEditor(stateTexts);
    const questionsEditor = buildStubEditor(questionsTexts);
    spyOn(editors, 'getStateEditor').mockReturnValue(stateEditor);
    spyOn(editors, 'getQuestionsEditor').mockReturnValue(questionsEditor);
    return { stateTexts, questionsTexts, stateEditor, questionsEditor };
}

export function installFakeLabel() {
    const label = { textContent: '' };
    Object.assign(globalThis, { document: { getElementById: () => label } });
    return label;
}

export function installFakeSessionStorage(initial: Record<string, string>) {
    const stored: Record<string, string> = { ...initial };
    const fake = { getItem: (key: string) => stored[key] ?? null, setItem: (key: string, value: string) => {
        stored[key] = value;
    } };
    Object.assign(globalThis, { sessionStorage: fake });
    return stored;
}

export function installFetchRecorder(draftToReturn: unknown) {
    RealFetchHolder.getInstance();
    const seen: { path: string; method: string; body: unknown }[] = [];
    async function fetchStubResponse(path: string | URL | Request, init?: RequestInit) {
        const body = init?.body === undefined ? null : JSON.parse(String(init.body));
        seen.push({ path: String(path), method: init?.method ?? 'GET', body: body });
        return Response.json(draftToReturn);
    }
    globalThis.fetch = fetchStubResponse as typeof fetch;
    return seen;
}

export function installStubSetInterval() {
    return spyOn(globalThis, 'setInterval').mockImplementation((() => 0) as unknown as typeof setInterval);
}
