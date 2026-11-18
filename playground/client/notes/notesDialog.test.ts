import { describe, test, expect, afterEach } from 'bun:test';
import { openNotesDialog } from './notesDialog';

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
    public showModal = (): void => {
        this.isOpen = true;
    };
    public close(choice: string) {
        this.returnValue = choice;
        this.isOpen = false;
        this.closeListener?.();
    }
}

function installFakeDom() {
    const dialog = new FakeDialog();
    const title = { textContent: '' };
    const textArea = new FakeTextArea();
    const elements: Record<string, unknown> = { notesDialog: dialog, notesDialogTitle: title, notesDialogText: textArea };
    Object.assign(globalThis, { HTMLDialogElement: FakeDialog, HTMLTextAreaElement: FakeTextArea, document: { getElementById: (id: string) => elements[id] ?? null } });
    return { dialog, title, textArea };
}

function removeFakeDom() {
    Reflect.deleteProperty(globalThis, 'document');
    Reflect.deleteProperty(globalThis, 'HTMLDialogElement');
    Reflect.deleteProperty(globalThis, 'HTMLTextAreaElement');
}

function clearNotesText(_text: string) {
}

function collectNotesText(received: string[]) {
    function pushNotesText(text: string) {
        received.push(text);
    }
    return pushNotesText;
}

function validateOpenFillsTheTitleAndTextAndShowsTheDialog() {
    const { dialog, title, textArea } = installFakeDom();
    openNotesDialog('State notes', 'start', clearNotesText);
    expect(dialog.isOpen).toBe(true);
    expect(title.textContent).toBe('State notes');
    expect(textArea.value).toBe('start');
}

function validateOkPassesTheTextToOnOk() {
    const { dialog, textArea } = installFakeDom();
    const received: string[] = [];
    openNotesDialog('t', 'start', collectNotesText(received));
    textArea.value = 'edited';
    dialog.close('ok');
    expect(received).toEqual(['edited']);
}

function validateCancelDoesNothing() {
    const { dialog, textArea } = installFakeDom();
    const received: string[] = [];
    openNotesDialog('t', 'start', collectNotesText(received));
    textArea.value = 'edited';
    dialog.close('cancel');
    expect(received).toEqual([]);
}

function validateEscapeDoesNothing() {
    const { dialog } = installFakeDom();
    const received: string[] = [];
    openNotesDialog('t', 'start', collectNotesText(received));
    dialog.close(dialog.returnValue);
    expect(received).toEqual([]);
}

function openNotesDialogWithoutADocument() {
    openNotesDialog('t', '', clearNotesText);
}

function validateOpenWithoutADocumentThrows() {
    expect(openNotesDialogWithoutADocument).toThrow();
}

function registerNotesDialogTests() {
    afterEach(removeFakeDom);
    test('test_open_fills_the_title_and_text_and_shows_the_dialog', validateOpenFillsTheTitleAndTextAndShowsTheDialog);
    test('test_ok_passes_the_text_to_on_ok', validateOkPassesTheTextToOnOk);
    test('test_cancel_does_nothing', validateCancelDoesNothing);
    test('test_escape_does_nothing', validateEscapeDoesNothing);
    test('test_open_without_a_document_throws', validateOpenWithoutADocumentThrows);
}

describe('notesDialog', registerNotesDialogTests);
