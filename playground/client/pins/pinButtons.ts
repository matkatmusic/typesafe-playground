import { getButton } from '../page/dom';
import { isBatchLocked, pageState } from '../page/state';

export function getPinText(): string {
    return 'Pin';
}

export function getPinInsteadText(): string {
    return 'Pin this version instead';
}

export function computePinButtonText(pinnedIndex: number | null, shownIndex: number): string {
    const isOtherVersionPinned = pinnedIndex !== null && pinnedIndex !== shownIndex;
    if (isOtherVersionPinned)
        return getPinInsteadText();
    return getPinText();
}

export function applyPinButtons(): void {
    const { pinnedIndex } = pageState;
    const shownIndex = pageState.index;
    const pinButton = getButton('pinButton');
    pinButton.textContent = computePinButtonText(pinnedIndex, shownIndex);
    const isLocked = isBatchLocked();
    pinButton.disabled = pinnedIndex === shownIndex || isLocked;
    getButton('unpinButton').disabled = pinnedIndex === null || isLocked;
}
