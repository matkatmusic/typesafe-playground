import type { InfoPart } from '../infoBox/infoTypes';
import { getElement } from '../page/dom';
import { addParts } from '../infoBox/infoDom';

export function listPinLineParts(pinnedIndex: number | null): InfoPart[] {
    if (pinnedIndex === null)
        return [['nothing pinned', 'other-label']];
    return [['pinned: version ', 'info-label'], [String(pinnedIndex + 1), 'info-value']];
}

export function applyPinInfo(pinnedIndex: number | null): void {
    const pinInfo = getElement('pinInfo');
    pinInfo.replaceChildren();
    // The pin line has no message parts, so no question.
    addParts(pinInfo, listPinLineParts(pinnedIndex), undefined);
}
