import type { Version } from '../playgroundHistory';
import { isEditorTextEdited } from './editedPosition';
import type { NoteKind } from './noteKind';
import { computeInheritedNote } from './noteInheritance';
import { markPageChanged } from './pageChanged';
import { getShownVersion, pageState } from './state';
import { sendJson } from './versionActions';

export async function saveVersionNote(version: Version, kind: NoteKind, text: string): Promise<void> {
  const field = `${kind}Note` as const;
  const response = await sendJson('/note', { id: version.id, [field]: text });
  const saved: Version = await response.json();
  version[field] = saved[field];
  markPageChanged('last edited');
}

export async function saveShownNote(kind: NoteKind, text: string): Promise<void> {
  const isEdited = isEditorTextEdited();
  if (isEdited) {
    pageState.pendingNotes[kind] = text;
    return;
  }
  await saveVersionNote(getShownVersion(), kind, text);
}

export async function saveInheritedNote(kind: NoteKind, baseNote: string | undefined, isUnchanged: boolean, newVersion: Version): Promise<void> {
  const note = computeInheritedNote(pageState.pendingNotes[kind], baseNote, isUnchanged);
  pageState.pendingNotes[kind] = null;
  if (note === undefined)
    return;
  await saveVersionNote(newVersion, kind, note);
}
