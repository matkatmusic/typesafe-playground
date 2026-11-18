import { describe, test, expect, afterEach, mock, spyOn } from 'bun:test';
import type { EditorView } from '@codemirror/view';
import * as editors from '../editors/editors';
import { pageState } from '../page/state';
import { refreshVersionBox } from './versionBox';

class FakeTextArea {
    public value = '';
    public disabled = false;
    public placeholder = '';
}

function buildStubEditor(text: string) {
    return { state: { doc: { toString: () => text } } } as unknown as EditorView;
}

function installFakeDom(noteText: FakeTextArea) {
    const elements: Record<string, unknown> = { versionLabel: { textContent: '' }, noteText: noteText };
    Object.assign(globalThis, { HTMLTextAreaElement: FakeTextArea, document: { getElementById: (id: string) => elements[id] ?? null } });
}

function installEditors(stateText: string) {
    spyOn(editors, 'getStateEditor').mockReturnValue(buildStubEditor(stateText));
    spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildStubEditor('{}'));
}

function removeFakeState() {
    mock.restore();
    Reflect.deleteProperty(globalThis, 'document');
    Reflect.deleteProperty(globalThis, 'HTMLTextAreaElement');
    pageState.versions = [];
    pageState.index = 0;
}

function installVersionWithNote(noteText: FakeTextArea) {
    installFakeDom(noteText);
    pageState.versions = [{ time: '2026-03-04T05:06:07.000Z', state: { a: 1 }, questions: {}, calls: 1, outputs: [{}] as never, note: 'kept' }];
    pageState.index = 0;
}

function validateEditedVersionDisablesTheNoteBox() {
    const noteText = new FakeTextArea();
    installVersionWithNote(noteText);
    installEditors('{"a":2}');
    refreshVersionBox();
    expect(noteText.disabled).toBe(true);
    expect(noteText.value).toBe('');
    expect(noteText.placeholder).toBe('Submit a run to add a note');
}

function validateRevertedVersionRestoresTheNoteBox() {
    const noteText = new FakeTextArea();
    installVersionWithNote(noteText);
    installEditors('{"a":2}');
    refreshVersionBox();
    mock.restore();
    installEditors('{"a":1}');
    refreshVersionBox();
    expect(noteText.disabled).toBe(false);
    expect(noteText.value).toBe('kept');
    expect(noteText.placeholder).toBe('Note about this run');
}

function registerNoteTests() {
    afterEach(removeFakeState);
    test('test_edited_version_disables_the_note_box', validateEditedVersionDisablesTheNoteBox);
    test('test_reverted_version_restores_the_note_box', validateRevertedVersionRestoresTheNoteBox);
}

describe('versionBox note', registerNoteTests);
