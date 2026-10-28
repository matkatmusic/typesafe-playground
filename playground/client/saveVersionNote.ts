import type { Version } from '../playgroundHistory';
import { isEditorTextEdited } from './editedPosition';
import type { NoteKind } from './noteKind';
import { buildNoteBody, storeSavedNote, type NoteLocation } from './noteLocation';
import { computeInheritedNote } from './noteInheritance';
import { markPageChanged } from './pageChanged';
import { getShownVersion, pageState } from './state';
import { sendJson } from './versionActions';

export async function saveVersionNote(version: Version, location: NoteLocation, text: string): Promise<void> {
  const response = await sendJson('/note', { id: version.id, ...buildNoteBody(location, text) });
  const saved: Version = await response.json();
  storeSavedNote(version, saved, location);
  markPageChanged('last edited');
}

export async function saveShownNote(location: NoteLocation, text: string): Promise<void> {
  const isEditorLocation = location.kind !== 'result';
  const isEdited = isEditorTextEdited();
  const isPending = isEditorLocation && isEdited;
  if (isPending) {
    pageState.pendingNotes[location.kind] = text;
    return;
  }
  await saveVersionNote(getShownVersion(), location, text);
}

export async function saveInheritedNote(kind: NoteKind, baseNote: string | undefined, isUnchanged: boolean, newVersion: Version): Promise<void> {
  const note = computeInheritedNote(pageState.pendingNotes[kind], baseNote, isUnchanged);
  pageState.pendingNotes[kind] = null;
  if (note === undefined)
    return;
  await saveVersionNote(newVersion, { kind: kind }, note);
}
