import { getElement } from './dom';
import { pageState } from './state';

export function markPageChanged(labelWord: string): void {
  pageState.isDirty = true;
  getElement('lastEditedLabel').textContent = `${labelWord}: ${new Date().toLocaleString()}`;
}
