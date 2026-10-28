import { isEditorTextEdited } from './editedPosition';
import { isKindTextEdited, type NoteKind } from './noteKind';
import { computeNoteStartText } from './noteInheritance';
import { openNotesDialog } from './notesDialog';
import { saveShownNote } from './saveVersionNote';
import { getShownVersion, pageState } from './state';

export function createNotesButton(id: string, title: string, kind: NoteKind): HTMLButtonElement {
  const button = document.createElement('button');
  button.id = id;
  button.className = 'format-json-button';
  button.textContent = 'notes';
  const field = `${kind}Note` as const;
  function saveText(text: string): Promise<void> {
    return saveShownNote(kind, text);
  }
  function openNotes(): void {
    const isEdited = isEditorTextEdited();
    const isUnchanged = !isKindTextEdited(kind);
    const startText = computeNoteStartText(isEdited, getShownVersion()[field], pageState.pendingNotes[kind], isUnchanged);
    openNotesDialog(title, startText, saveText);
  }
  button.addEventListener('click', openNotes);
  return button;
}
