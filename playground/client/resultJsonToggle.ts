import { getElement } from './dom';

export function toggleResultJson(): void {
  const editorBox = getElement('resultJsonEditor');
  editorBox.hidden = !editorBox.hidden;
}
