import { getElement } from './dom';
import { pageState } from './state';

export function markPageChanged(): void {
  pageState.isDirty = true;
  getElement('lastEditedLabel').textContent = `last edited: ${new Date().toLocaleString()}`;
}
