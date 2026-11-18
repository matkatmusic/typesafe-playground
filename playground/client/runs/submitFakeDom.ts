import type { EditorView } from '@codemirror/view';
import type { Version } from '../../history/playgroundHistory';
import { pageState } from '../page/state';
import { getSubmitText } from './submit';

export class FakeButton {
    public disabled = false;
    public textContent = getSubmitText();
}
export class FakeInput {
    public value = '';
    public type = 'password';
    public checked = false;
}
export class FakeBox {
    public textContent = '';
}

export function getIsoTime() {
    return '2026-03-04T05:06:07.000Z';
}
export function getVersion() {
    return { time: getIsoTime(), state: { a: 1 }, questions: { q: { type: 'noul' } }, calls: 1, outputs: [{ usage: { input_tokens: 1000000, output_tokens: 1 } }] } as unknown as Version;
}

class RealFetchHolder {
    private static instance: RealFetchHolder | undefined;
    public readonly realFetch = globalThis.fetch;
    private constructor() {}
    public static getInstance() {
        RealFetchHolder.instance ??= new RealFetchHolder();
        return RealFetchHolder.instance;
    }
}

export function installFakeDom(hasEnvKey: boolean) {
    RealFetchHolder.getInstance();
    const elements = {
        data: new FakeBox(), graphContainerBox: new FakeBox(), winnerBox: new FakeBox(), errorLine: new FakeBox(), costLabel: new FakeBox(), totalCostLabel: new FakeBox(), tokensLabel: new FakeBox(), versionLabel: new FakeBox(), lastEditedLabel: new FakeBox(),
        submitButton: new FakeButton(), prevVersionButton: new FakeButton(), deleteVersionButton: new FakeButton(), nextVersionButton: new FakeButton(), pinButton: new FakeButton(), unpinButton: new FakeButton(), callsPicker: new FakeInput(), typeSafeKeyEditor: new FakeInput(), providerSwitch: new FakeInput(), noteText: new FakeInput(),
    };
    elements.data.textContent = JSON.stringify({ versions: [getVersion()], hasEnvKey });
    function getElementById(id: string) {
        return (elements as Record<string, unknown>)[id] ?? null;
    }
    Object.assign(globalThis, { document: { getElementById }, HTMLButtonElement: FakeButton, HTMLInputElement: FakeInput, HTMLTextAreaElement: FakeInput });
    return elements;
}

export function removeFakeDom() {
    for (const name of ['document', 'HTMLButtonElement', 'HTMLInputElement', 'HTMLTextAreaElement'])
        Reflect.deleteProperty(globalThis, name);
    globalThis.fetch = RealFetchHolder.getInstance().realFetch;
    pageState.isDirty = false;
    pageState.versions = [];
    pageState.index = 0;
}

export function buildStubStateEditor(text: string) {
    return { state: { doc: { toString: () => text } }, dispatch: () => {} } as unknown as EditorView;
}
