import type { InfoPart } from './infoTypes';
import { getElement } from './dom';
import { addParts } from './infoDom';

export function listPinLineParts(pinnedIndex: number | null): InfoPart[] {
  if (pinnedIndex === null)
    return [['nothing pinned', 'other-label']];
  return [['pinned: version ', 'info-label'], [String(pinnedIndex + 1), 'info-value']];
}

export function applyPinInfo(pinnedIndex: number | null): void {
  const pinInfo = getElement('pinInfo');
  pinInfo.replaceChildren();
  addParts(pinInfo, listPinLineParts(pinnedIndex));
  // getButton('pinButton').disabled = pinnedId !== null;
  // getButton('unpinButton').disabled = pinnedId === null;
}
