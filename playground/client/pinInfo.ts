import type { InfoPart } from './infoTypes';
import { getButton, getElement } from './dom';
import { addParts } from './infoDom';

export function listPinLineParts(pinnedId: number | null): InfoPart[] {
  if (pinnedId === null)
    return [['nothing pinned', 'other-label']];
  return [['pinned: version ', 'info-label'], [String(pinnedId), 'info-value']];
}

export function applyPinInfo(pinnedId: number | null): void {
  const pinInfo = getElement('pinInfo');
  pinInfo.replaceChildren();
  addParts(pinInfo, listPinLineParts(pinnedId));
  getButton('pinButton').disabled = pinnedId !== null;
  getButton('unpinButton').disabled = pinnedId === null;
}
