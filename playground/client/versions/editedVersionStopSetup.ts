import { mock, spyOn } from 'bun:test';
import type { EditorView } from '@codemirror/view';
import * as editors from '../editors/editors';
import * as graphs from '../graphs/graphs';
import * as noteBox from '../notes/noteBox';
import * as pinButtons from '../pins/pinButtons';
import { pageState } from '../page/state';
import * as winnersDom from '../runs/winnersDom';

class FakeButton {
    public disabled = false;
    public textContent = '';
}
class FakeInput {
    public value = '';
    public type = 'password';
}
class FakeBox {
    public textContent = '';
}

interface EditorTexts {
    state: string;
    questions: string;
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

export function getIsoTime() {
    return '2026-03-04T05:06:07.000Z';
}

export function buildVersion() {
    return { time: getIsoTime(), state: { a: 1 }, questions: { q: { type: 'noul' } } as never, calls: 1, outputs: [] };
}

function writeNothing() {}

export function removeFakeState() {
    mock.restore();
    for (const name of ['document', 'HTMLButtonElement', 'HTMLInputElement', 'HTMLTextAreaElement'])
        Reflect.deleteProperty(globalThis, name);
    globalThis.fetch = RealFetchHolder.getInstance().realFetch;
    pageState.versions = [];
    pageState.index = 0;
    pageState.isDirty = false;
    pageState.editedDraft = null;
}

function buildElements() {
    const elements = {
        data: new FakeBox(), versionLabel: new FakeBox(), costLabel: new FakeBox(), totalCostLabel: new FakeBox(), tokensLabel: new FakeBox(), graphContainerBox: new FakeBox(), winnerBox: new FakeBox(), lastEditedLabel: new FakeBox(), errorLine: new FakeBox(),
        prevVersionButton: new FakeButton(), deleteVersionButton: new FakeButton(), nextVersionButton: new FakeButton(), submitButton: new FakeButton(), callsPicker: new FakeInput(), typeSafeKeyEditor: new FakeInput(), providerSwitch: new FakeInput(),
    };
    elements.data.textContent = JSON.stringify({ versions: [], hasEnvKey: true });
    elements.callsPicker.value = '1';
    elements.typeSafeKeyEditor.value = 'key';
    return elements;
}

function installFakeDom(elements: ReturnType<typeof buildElements>) {
    function getElementById(id: string) {
        return (elements as Record<string, unknown>)[id] ?? null;
    }
    Object.assign(globalThis, { document: { getElementById }, HTMLButtonElement: FakeButton, HTMLInputElement: FakeInput, HTMLTextAreaElement: FakeInput });
}

function buildTextEditor(texts: EditorTexts, key: keyof EditorTexts) {
    return { state: { doc: { toString: () => texts[key] } }, dispatch: writeNothing } as unknown as EditorView;
}

function buildJsonSaver(texts: EditorTexts, key: keyof EditorTexts) {
    return function saveJson(value: unknown) {
        texts[key] = JSON.stringify(value);
    };
}

function buildTextFiller(texts: EditorTexts, stateEditor: EditorView) {
    return function saveEditorText(editor: EditorView, text: string) {
        if (editor === stateEditor)
            texts.state = text;
        else
            texts.questions = text;
    };
}

function installEditorSpies(texts: EditorTexts) {
    const stateEditor = buildTextEditor(texts, 'state');
    const questionsEditor = buildTextEditor(texts, 'questions');
    spyOn(editors, 'getStateEditor').mockReturnValue(stateEditor);
    spyOn(editors, 'getQuestionsEditor').mockReturnValue(questionsEditor);
    spyOn(editors, 'renderStateJson').mockImplementation(buildJsonSaver(texts, 'state'));
    spyOn(editors, 'renderQuestionsJson').mockImplementation(buildJsonSaver(texts, 'questions'));
    spyOn(editors, 'fillEditorText').mockImplementation(buildTextFiller(texts, stateEditor));
    spyOn(editors, 'renderResultJson').mockImplementation(writeNothing);
    spyOn(editors, 'setEditorLocked').mockImplementation(writeNothing);
}

function installPageSpies() {
    spyOn(graphs, 'renderGraphs').mockImplementation(writeNothing);
    spyOn(winnersDom, 'renderWinners').mockImplementation(writeNothing);
    spyOn(noteBox, 'applyNoteBox').mockImplementation(writeNothing);
    spyOn(pinButtons, 'applyPinButtons').mockImplementation(writeNothing);
}

export function installOneVersionWithAnEditedState() {
    RealFetchHolder.getInstance();
    const elements = buildElements();
    installFakeDom(elements);
    const texts = { state: '{"a": 2}', questions: '{"q": {"type": "noul"}}' };
    installEditorSpies(texts);
    installPageSpies();
    pageState.versions = [buildVersion()];
    pageState.index = 0;
    return { elements, texts };
}
