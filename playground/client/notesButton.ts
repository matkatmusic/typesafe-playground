import { openNotesDialog } from './notesDialog';

function saveNoteText(): void {}

export function createNotesButton(id: string, title: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.id = id;
  button.className = 'format-json-button';
  button.textContent = 'notes';
  function openNotes(): void {
    openNotesDialog(title, '', saveNoteText);
  }
  button.addEventListener('click', openNotes);
  return button;
}
