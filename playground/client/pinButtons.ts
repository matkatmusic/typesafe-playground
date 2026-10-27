import { getButton } from './dom';
import { getShownVersion, pageState } from './state';

export const PIN_TEXT = 'Pin';
export const PIN_INSTEAD_TEXT = 'Pin this version instead';

export function computePinButtonText(pinnedId: number | null, shownId: number): string {
  const isOtherVersionPinned = pinnedId !== null && pinnedId !== shownId;
  if (isOtherVersionPinned)
    return PIN_INSTEAD_TEXT;
  return PIN_TEXT;
}

export function applyPinButtons(): void {
  const { pinnedId } = pageState;
  const shownId = getShownVersion().id;
  const pinButton = getButton('pinButton');
  pinButton.textContent = computePinButtonText(pinnedId, shownId);
  pinButton.disabled = pinnedId === shownId;
  getButton('unpinButton').disabled = pinnedId === null;
}
