import { test, expect, mock, spyOn } from 'bun:test';
import * as appendEditedVersionModule from './appendEditedVersion';
import * as fileViewModule from '../page/fileView';
import { pageState } from '../page/state';
import { writeVersionsFile } from './versionActions';

function installFakeFetch(seenPaths: string[]) {
    const realFetch = globalThis.fetch;
    async function fetchVersionsRecordingPath(path: string) {
        seenPaths.push(path);
        return Response.json({ versions: [{ id: 1 }] });
    }
    globalThis.fetch = fetchVersionsRecordingPath as unknown as typeof fetch;
    return realFetch;
}

function refreshNothing() {}

async function closeNothing() {}

function getFakeElement() {
    return { textContent: '' };
}

function createFakeWritable(written: string[]) {
    async function writeData(data: string) {
        written.push(data);
    }
    return { write: writeData, close: closeNothing };
}

function installFakePage(written: string[]) {
    const writable = createFakeWritable(written);
    async function createWritable() {
        return writable;
    }
    pageState.fileHandle = { createWritable } as unknown as FileSystemFileHandle;
    Object.assign(globalThis, { document: { getElementById: getFakeElement } });
}

function resetGlobals(realFetch: typeof fetch) {
    globalThis.fetch = realFetch;
    mock.restore();
    Reflect.deleteProperty(globalThis, 'document');
    pageState.fileHandle = null;
    pageState.isDirty = false;
}

async function executeSaveWithAppendResult(isAppended: boolean) {
    const seenPaths: string[] = [];
    const written: string[] = [];
    const realFetch = installFakeFetch(seenPaths);
    spyOn(appendEditedVersionModule, 'appendEditedVersion').mockResolvedValue(isAppended);
    spyOn(fileViewModule, 'refreshFileView').mockImplementation(refreshNothing);
    installFakePage(written);
    try {
        const result = await writeVersionsFile();
        return { result, seenPaths, written };
    }
    finally {
        resetGlobals(realFetch);
    }
}

async function validateSaveWritesTheFileAfterTheEditedVersionIsAppended() {
    const { result, seenPaths, written } = await executeSaveWithAppendResult(true);
    expect(result).toBe(true);
    expect(seenPaths).toEqual(['/save']);
    expect(written.length).toBe(1);
}

async function validateSaveWritesNothingWhenTheEditedVersionIsRefused() {
    const { result, seenPaths, written } = await executeSaveWithAppendResult(false);
    expect(result).toBe(false);
    expect(seenPaths).toEqual([]);
    expect(written).toEqual([]);
}

test('test_save_writes_the_file_after_the_edited_version_is_appended', validateSaveWritesTheFileAfterTheEditedVersionIsAppended);
test('test_save_writes_nothing_when_the_edited_version_is_refused', validateSaveWritesNothingWhenTheEditedVersionIsRefused);
