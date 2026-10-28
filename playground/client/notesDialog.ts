import { getDialog, getElement } from './dom';

function getNotesText(): HTMLTextAreaElement {
  const element = getElement('notesDialogText');
  if (!(element instanceof HTMLTextAreaElement))
    throw new Error('element notesDialogText is not a textarea');
  return element;
}

export function openNotesDialog(title: string, startText: string, onOk: (text: string) => void): void {
  const dialog = getDialog('notesDialog');
  const notesText = getNotesText();
  getElement('notesDialogTitle').textContent = title;
  notesText.value = startText;
  dialog.returnValue = 'cancel';
  function emitOk(): void {
    const isOk = dialog.returnValue === 'ok';
    if (isOk)
      onOk(notesText.value);
  }
  dialog.addEventListener('close', emitOk, { once: true });
  dialog.showModal();
}
