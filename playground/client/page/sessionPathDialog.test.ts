import { describe, test, expect, afterEach } from 'bun:test';
import { closeSessionPathDialog, copySessionPath, openSessionPathDialog } from './sessionPathDialog';

class FakeDialog {
    public isOpen = false;
    public showModal = () => {
        this.isOpen = true;
    };
    public close() {
        this.isOpen = false;
    }
}

class FakeInput {
    public value = '';
    public selectCount = 0;
    public select() {
        this.selectCount++;
    }
}

function installFakeDom() {
    const dialog = new FakeDialog();
    const field = new FakeInput();
    const data = { textContent: JSON.stringify({ versions: [], historyPath: '/abs/session.json', hasEnvKey: true }) };
    const elements: Record<string, unknown> = { sessionPathDialog: dialog, sessionPathField: field, data };
    Object.assign(globalThis, { HTMLDialogElement: FakeDialog, HTMLInputElement: FakeInput, document: { getElementById: (id: string) => elements[id] ?? null } });
    return { dialog, field };
}

function removeFakeDom() {
    Reflect.deleteProperty(globalThis, 'document');
    Reflect.deleteProperty(globalThis, 'HTMLDialogElement');
    Reflect.deleteProperty(globalThis, 'HTMLInputElement');
}

function validateOpenShowsTheSessionPathSelected() {
    const { dialog, field } = installFakeDom();
    openSessionPathDialog();
    expect(dialog.isOpen).toBe(true);
    expect(field.value).toBe('/abs/session.json');
    expect(field.selectCount).toBe(1);
}

function validateCloseHidesTheDialog() {
    const { dialog } = installFakeDom();
    openSessionPathDialog();
    closeSessionPathDialog();
    expect(dialog.isOpen).toBe(false);
}

async function validateCopyWritesThePathToTheClipboard() {
    installFakeDom();
    const written: string[] = [];
    const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    async function writeText(text: string) {
        written.push(text);
    }
    Object.defineProperty(globalThis, 'navigator', { value: { clipboard: { writeText } }, configurable: true });
    openSessionPathDialog();
    await copySessionPath();
    expect(written).toEqual(['/abs/session.json']);
    if (original !== undefined)
        Object.defineProperty(globalThis, 'navigator', original);
}

function registerSessionPathDialogTests() {
    afterEach(removeFakeDom);
    test('test_open_shows_the_session_path_selected', validateOpenShowsTheSessionPathSelected);
    test('test_close_hides_the_dialog', validateCloseHidesTheDialog);
    test('test_copy_writes_the_path_to_the_clipboard', validateCopyWritesThePathToTheClipboard);
}

describe('sessionPathDialog', registerSessionPathDialogTests);
