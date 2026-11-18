import { mock, spyOn } from 'bun:test';
import type { EditorView } from '@codemirror/view';
import * as editors from '../editors/editors';
import type { NoteLocation } from './noteLocation';
import { createNotesButton } from './notesButton';
import { buildEmptyPendingNotes, pageState } from '../page/state';

class FakeTextArea {
    public value = '';
}

class FakeDialog {
    public returnValue = '';
    public isOpen = false;
    public closeListener: (() => void) | null = null;
    public addEventListener(_name: string, listener: () => void) {
        this.closeListener = listener;
    }
    public showModal = () => {
        this.isOpen = true;
    };
}

class FakeButton {
    public id = '';
    public className = '';
    public textContent = '';
    public clickListener: (() => void) | null = null;
    public addEventListener(_name: string, listener: () => void) {
        this.clickListener = listener;
    }
}

export function installFakeDom() {
    const dialog = new FakeDialog();
    const title = { textContent: '' };
    const textArea = new FakeTextArea();
    const elements: Record<string, unknown> = { notesDialog: dialog, notesDialogTitle: title, notesDialogText: textArea, lastEditedLabel: { textContent: '' } };
    Object.assign(globalThis, {
        HTMLDialogElement: FakeDialog,
        HTMLTextAreaElement: FakeTextArea,
        document: { createElement: () => new FakeButton(), getElementById: (id: string) => elements[id] ?? null },
    });
    return { dialog, title, textArea };
}

export function installPage(stateText: string) {
    spyOn(editors, 'getStateEditor').mockReturnValue({ state: { doc: { toString: () => stateText } } } as unknown as EditorView);
    spyOn(editors, 'getQuestionsEditor').mockReturnValue({ state: { doc: { toString: () => '{}' } } } as unknown as EditorView);
    pageState.versions = [{ time: 't', state: { a: 1 }, questions: {}, calls: 0, outputs: [], stateNote: 'saved' }];
    pageState.index = 0;
}

export function removeFakeState() {
    mock.restore();
    Reflect.deleteProperty(globalThis, 'document');
    Reflect.deleteProperty(globalThis, 'HTMLDialogElement');
    Reflect.deleteProperty(globalThis, 'HTMLTextAreaElement');
    pageState.versions = [];
    pageState.index = 0;
    pageState.pendingNotes = buildEmptyPendingNotes();
}

export function triggerNewButtonClick(location: NoteLocation = { kind: 'state' }) {
    const button = createNotesButton('stateNotesButton', 'State notes', location) as unknown as FakeButton;
    button.clickListener?.();
    return button;
}
