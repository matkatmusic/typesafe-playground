import type { Version } from '../playgroundHistory';
import { renderCostAndTokens } from './costTokens';
import { renderResultJson, renderStateJson } from './editors';
import { refreshFileView } from './fileView';
import { pageState } from './state';
import { computeUnsavedStep, readUnsavedChoice } from './unsavedDialog';

const VERSIONS_FILE_TYPES = [{ description: 'Playground versions', accept: { 'application/json': ['.json'] } }];
const VERSIONS_FILE_NAME = 'playground-versions.json';

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
  pageState.isDirty = false;
  const lastVersion = replaced.versions[replaced.versions.length - 1];
  renderCostAndTokens(lastVersion);
  renderStateJson(lastVersion.state);
  renderResultJson(lastVersion.outputs);
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
  return window.showOpenFilePicker({ types: VERSIONS_FILE_TYPES });
}

function saveVersionsPicker(): Promise<FileSystemFileHandle> {
  return window.showSaveFilePicker({ suggestedName: VERSIONS_FILE_NAME, types: VERSIONS_FILE_TYPES });
}

export async function writeVersionsFile(): Promise<boolean> {
  const handle = pageState.fileHandle ?? (await executePicker(saveVersionsPicker));
  if (handle === null)
    return false;
  const response = await sendJson('/save', {});
  const saved: { versions: Version[] } = await response.json();
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(saved.versions, null, 2) + '\n');
  await writable.close();
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
