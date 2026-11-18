import type { Version } from '../../history/playgroundHistory';
import { appendEditedVersion } from './appendEditedVersion';
import { refreshFileView } from '../page/fileView';
import { applyPinInfo } from '../pins/pinInfo';
import { buildEmptyPendingNotes, pageState } from '../page/state';
import { computeUnsavedStep, readUnsavedChoice } from '../page/unsavedDialog';
import { renderLastVersion } from './versionBox';

function getVersionsFileTypes() {
    return [{ description: 'Playground versions', accept: { 'application/json': ['.json'] } }];
}

function getVersionsFileName(): string {
    return 'playground-versions.json';
}

export async function sendJson(path: string, body: object): Promise<Response> {
    const response = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok)
        throw new Error(`HTTP ${response.status} ${await response.text()}`);
    return response;
}

async function replaceVersions(path: string, body: object): Promise<void> {
    const response = await sendJson(path, body);
    const replaced: { versions: Version[] } = await response.json();
    pageState.versions = replaced.versions;
    pageState.editedDraft = null;
    pageState.pinnedIndex = null;
    pageState.pendingNotes = buildEmptyPendingNotes();
    pageState.isDirty = false;
    renderLastVersion();
    applyPinInfo(pageState.pinnedIndex);
}

export async function executePicker<T>(pick: () => Promise<T>): Promise<T | null> {
    try {
        return await pick();
    }
    catch (failure) {
        const isCancelled = failure instanceof DOMException && failure.name === 'AbortError';
        if (isCancelled)
            return null;
        throw failure;
    }
}

function openVersionsPicker(): Promise<FileSystemFileHandle[]> {
    return window.showOpenFilePicker({ types: getVersionsFileTypes() });
}

function saveVersionsPicker(): Promise<FileSystemFileHandle> {
    return window.showSaveFilePicker({ suggestedName: getVersionsFileName(), types: getVersionsFileTypes() });
}

async function writeVersionsToHandle(handle: FileSystemFileHandle, versions: Version[]): Promise<void> {
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(versions, null, 2) + '\n');
    await writable.close();
}

export async function writeVersionsFile(): Promise<boolean> {
    const handle = pageState.fileHandle ?? (await executePicker(saveVersionsPicker));
    if (handle === null)
        return false;
    const isEditedVersionAppended = await appendEditedVersion();
    if (!isEditedVersionAppended)
        return false;
    const response = await sendJson('/save', {});
    const saved: { versions: Version[] } = await response.json();
    await writeVersionsToHandle(handle, saved.versions);
    pageState.fileHandle = handle;
    pageState.isDirty = false;
    refreshFileView();
    return true;
}

export async function executeUnsavedPrompt(): Promise<boolean> {
    if (!pageState.isDirty)
        return true;
    const choice = await readUnsavedChoice();
    const step = computeUnsavedStep(choice);
    if (step === 'stop')
        return false;
    if (step === 'save')
        return writeVersionsFile();
    return true;
}

export async function createNewDocument(): Promise<void> {
    const isContinuing = await executeUnsavedPrompt();
    if (!isContinuing)
        return;
    await replaceVersions('/new', {});
    pageState.fileHandle = null;
    refreshFileView();
}

export async function openVersionsFile(): Promise<void> {
    const isContinuing = await executeUnsavedPrompt();
    if (!isContinuing)
        return;
    const handles = await executePicker(openVersionsPicker);
    if (handles === null)
        return;
    const [handle] = handles;
    const file = await handle.getFile();
    const versions: Version[] = JSON.parse(await file.text());
    await replaceVersions('/open', { versions: versions });
    pageState.fileHandle = handle;
    refreshFileView();
}

export async function resetToSavedFile(): Promise<void> {
    const handle = pageState.fileHandle;
    if (handle === null)
        throw new Error('no file is open');
    const isConfirmed = confirm(`Throw away unsaved changes and re-read ${handle.name}?`);
    if (!isConfirmed)
        return;
    const file = await handle.getFile();
    const versions: Version[] = JSON.parse(await file.text());
    await replaceVersions('/open', { versions: versions });
}
