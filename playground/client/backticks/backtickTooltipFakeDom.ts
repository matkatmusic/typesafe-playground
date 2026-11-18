import { json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { appendReferenceText, buildBacktickHoverSource } from './backtickTooltip';

export interface FakeNode {
    className: string;
    textContent: string;
    title: string;
    style: Record<string, string>;
    listeners: Record<string, () => void>;
    addEventListener(type: string, listener: () => void): void;
    getBoundingClientRect(): { left: number; bottom: number };
    remove(): void;
}

class FakeBody {
    private static instance: FakeBody | undefined;
    public readonly children: FakeNode[] = [];

    private constructor() {}

    public static getInstance(): FakeBody {
        FakeBody.instance ??= new FakeBody();
        return FakeBody.instance;
    }
}

export function getBodyChildren(): FakeNode[] {
    return FakeBody.getInstance().children;
}

function createFakeNode(): FakeNode {
    const node: FakeNode = {
        className: '', textContent: '', title: '', style: {}, listeners: {},
        addEventListener(type, listener) {
            node.listeners[type] = listener;
        },
        getBoundingClientRect() {
            return { left: 10, bottom: 20 };
        },
        remove() {
            getBodyChildren().splice(getBodyChildren().indexOf(node), 1);
        },
    };
    return node;
}

function createFakeText(text: string): FakeNode {
    return Object.assign(createFakeNode(), { textContent: text });
}

export function installFakeDocument() {
    getBodyChildren().length = 0;
    const body = { appendChild: (child: FakeNode) => getBodyChildren().push(child) };
    Object.assign(globalThis, { document: { createElement: createFakeNode, createTextNode: createFakeText, body } });
}

export function removeFakeDocument() {
    Reflect.deleteProperty(globalThis, 'document');
}

export function collectAppendReferenceText(text: string, textState: unknown, textQuestions: unknown): FakeNode[] {
    installFakeDocument();
    const nodes: FakeNode[] = [];
    appendReferenceText({ appendChild: (child: FakeNode) => nodes.push(child) } as unknown as HTMLElement, text, textState, textQuestions);
    return nodes;
}

export function createJsonState(text: string): EditorState {
    return EditorState.create({ doc: text, extensions: [json()] });
}

export function getStateText(): string {
    return '{"message": {"text": "Hello"}}';
}

export function getQuestionsText(): string {
    return '{"q": "Does `message.text` ask? Or `nope`? Plain words. `list[1]`"}';
}

export function createSource(stateText: string, questionsText: string) {
    function getEditorStates(): EditorState[] {
        return [createJsonState(stateText), createJsonState(questionsText)];
    }
    return buildBacktickHoverSource(getEditorStates);
}

export function createView(text: string): EditorView {
    return { state: createJsonState(text) } as unknown as EditorView;
}
