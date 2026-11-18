import { describe, test, expect, afterEach, mock, spyOn } from 'bun:test';
import { saveNote } from './noteActions';
import { pageState } from '../page/state';

class FakeTextArea {
    public value = 'my note';
}

interface RecordedRequest {
    path: string;
    body: string;
}

function removeFakeState() {
    mock.restore();
    Reflect.deleteProperty(globalThis, 'document');
    Reflect.deleteProperty(globalThis, 'HTMLTextAreaElement');
    pageState.isDirty = false;
    pageState.versions = [];
    pageState.index = 0;
}

function installFakeDom() {
    const elements = { noteText: new FakeTextArea(), lastEditedLabel: { textContent: '' } };
    const getById = (id: keyof typeof elements) => elements[id];
    Object.assign(globalThis, { HTMLTextAreaElement: FakeTextArea, document: { getElementById: getById } });
    return elements;
}

function installRecordingFetch(version: object): RecordedRequest {
    const recorded: RecordedRequest = { path: '', body: '' };
    const saveRequestAndRespond = async (path: string | URL | Request, init?: RequestInit) => {
        recorded.path = String(path);
        recorded.body = String(init?.body);
        return Response.json({ ...version, note: 'my note' });
    };
    spyOn(globalThis, 'fetch').mockImplementation(saveRequestAndRespond as unknown as typeof fetch);
    return recorded;
}

function installRefusingFetch() {
    const sendRefusal = async () => new Response('no', { status: 400 });
    spyOn(globalThis, 'fetch').mockImplementation(sendRefusal as unknown as typeof fetch);
}

async function validateSaveNotePostsTheNoteToTheNoteRoute() {
    installFakeDom();
    const version = { time: 't', state: {}, questions: {}, calls: 1, outputs: [] };
    pageState.versions = [{ ...version }, version];
    pageState.index = 1;
    const recorded = installRecordingFetch(version);
    await saveNote();
    expect(recorded.path).toBe('/note');
    expect(JSON.parse(recorded.body)).toEqual({ index: 1, note: 'my note' });
}

async function validateSaveNoteMarksTheChange() {
    const elements = installFakeDom();
    const version = { time: 't', state: {}, questions: {}, calls: 1, outputs: [] };
    pageState.versions = [{ ...version }, version];
    pageState.index = 1;
    installRecordingFetch(version);
    await saveNote();
    expect((version as { note?: string }).note).toBe('my note');
    expect(pageState.isDirty).toBe(true);
    expect(elements.lastEditedLabel.textContent).toContain('last edited: ');
}

async function validateSaveNoteLeavesThePageCleanWhenTheServerRefuses() {
    installFakeDom();
    pageState.versions = [{ time: 't', state: {}, questions: {}, calls: 0, outputs: [] }];
    installRefusingFetch();
    await expect(saveNote()).rejects.toThrow('HTTP 400');
    expect(pageState.isDirty).toBe(false);
}

function registerNoteActionTests() {
    afterEach(removeFakeState);
    test('test_save_note_posts_the_note_to_the_note_route', validateSaveNotePostsTheNoteToTheNoteRoute);
    test('test_save_note_marks_the_change', validateSaveNoteMarksTheChange);
    test('test_save_note_leaves_the_page_clean_when_the_server_refuses', validateSaveNoteLeavesThePageCleanWhenTheServerRefuses);
}

describe('noteActions', registerNoteActionTests);
