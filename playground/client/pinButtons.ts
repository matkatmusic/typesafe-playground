import { getButton } from './dom';
import { isBatchLocked, pageState } from './state';

export const PIN_TEXT = 'Pin';
export const PIN_INSTEAD_TEXT = 'Pin this version instead';

export function computePinButtonText(pinnedIndex: number | null, shownIndex: number): string {
  const isOtherVersionPinned = pinnedIndex !== null && pinnedIndex !== shownIndex;
  if (isOtherVersionPinned)
    return PIN_INSTEAD_TEXT;
  return PIN_TEXT;
}

export function applyPinButtons(): void {
  const { pinnedIndex } = pageState;
  const shownIndex = pageState.index;
  const pinButton = getButton('pinButton');
  pinButton.textContent = computePinButtonText(pinnedIndex, shownIndex);
  const isLocked = isBatchLocked();
  // pinButton.disabled = pinnedIndex === shownIndex;
  pinButton.disabled = pinnedIndex === shownIndex || isLocked;
  // getButton('unpinButton').disabled = pinnedIndex === null;
  getButton('unpinButton').disabled = pinnedIndex === null || isLocked;
}
