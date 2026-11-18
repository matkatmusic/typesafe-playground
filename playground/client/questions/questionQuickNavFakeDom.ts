import { mock, spyOn } from 'bun:test';
import { json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import type { StateEffectType, TransactionSpec } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import * as editors from '../editors/editors';

function getScrollEffectType(): StateEffectType<unknown> {
    return (EditorView.scrollIntoView(0) as unknown as { type: StateEffectType<unknown> }).type;
}

export function removeFakeState() {
    mock.restore();
    Reflect.deleteProperty(globalThis, 'document');
}

export function createState(doc: string): EditorState {
    return EditorState.create({ doc: doc, extensions: [json()] });
}

function createFakeElement() {
    const element = {
        className: '', textContent: '', value: '', hidden: false, children: [] as unknown[], attrs: {} as Record<string, string>, listeners: {} as Record<string, () => void>,
        setAttribute(key: string, value: string) {
            element.attrs[key] = value;
        },
        addEventListener(type: string, listener: () => void) {
            element.listeners[type] = listener;
        },
        replaceChildren(...children: unknown[]) {
            element.children = children;
        },
    };
    return element;
}

export type FakeElement = ReturnType<typeof createFakeElement>;

export function installFakeDocument() {
    const errorLine = createFakeElement();
    function getElementById(id: string): FakeElement | null {
        if (id === 'errorLine')
            return errorLine;
        return null;
    }
    Object.assign(globalThis, { document: { createElement: createFakeElement, getElementById: getElementById } });
    return errorLine;
}

export function installStubQuestionsEditor(doc: string) {
    const scrolledPositions: number[] = [];
    const view = { state: createState(doc), dispatch: saveDispatch };
    function saveDispatch(spec: TransactionSpec): void {
        for (const effect of view.state.update(spec).effects) {
            const isScrollEffect = effect.is(getScrollEffectType());
            if (isScrollEffect)
                scrolledPositions.push((effect.value as { range: { from: number } }).range.from);
        }
    }
    spyOn(editors, 'getQuestionsEditor').mockReturnValue(view as unknown as EditorView);
    return { view: view, scrolledPositions: scrolledPositions };
}

export function readOptionValues(select: FakeElement): string[] {
    const values: string[] = [];
    for (const option of select.children as FakeElement[])
        values.push(option.value);
    return values;
}
