import { isEditorTextEdited } from './editedPosition';
import { isKindTextEdited } from './noteKind';
import { readSavedNote, type NoteLocation } from './noteLocation';
import { computeNoteStartText } from './noteInheritance';
import { openNotesDialog } from './notesDialog';
import { saveShownNote } from './saveVersionNote';
import { getShownVersion, pageState } from './state';

export function computeLocationStartText(location: NoteLocation): string {
  const savedNote = readSavedNote(getShownVersion(), location);
  if (location.kind === 'result')
    return savedNote ?? '';
  return computeNoteStartText(isEditorTextEdited(), savedNote, pageState.pendingNotes[location.kind], !isKindTextEdited(location.kind));
}

export function createNotesButton(id: string, title: string, location: NoteLocation): HTMLButtonElement {
  const button = document.createElement('button');
  button.id = id;
  button.className = 'format-json-button';
  button.textContent = 'notes';
  function saveText(text: string): Promise<void> {
    return saveShownNote(location, text);
  }
  function openNotes(): void {
    openNotesDialog(title, computeLocationStartText(location), saveText);
  }
  button.addEventListener('click', openNotes);
  return button;
}
