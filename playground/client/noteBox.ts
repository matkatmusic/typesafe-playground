import type { Version } from '../playgroundHistory';
import { getElement } from './dom';

export function computeNoteValue(isRunCompleted: boolean, note: string | undefined): string {
  return isRunCompleted ? note || '' : '';
}

export function computeNotePlaceholder(isRunCompleted: boolean): string {
  return isRunCompleted ? 'Note about this run' : 'Submit a run to add a note';
}

export function getNoteText(): HTMLTextAreaElement {
  const element = getElement('noteText');
  if (!(element instanceof HTMLTextAreaElement))
    throw new Error('element noteText is not a textarea');
  return element;
}

export function applyNoteBox(version: Version): void {
  const isRunCompleted = version.outputs.length > 0;
  const noteText = getNoteText();
  noteText.value = computeNoteValue(isRunCompleted, version.note);
  noteText.disabled = !isRunCompleted;
  noteText.placeholder = computeNotePlaceholder(isRunCompleted);
}
