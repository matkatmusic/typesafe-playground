import { getButton } from '../page/dom';
import { computePositionCount } from './editedPosition';
import { isBatchLocked, pageState } from '../page/state';

export function isVersionMovePossible(): boolean {
  const isLocked = isBatchLocked();
  if (isLocked)
    return false;
  // return pageState.versions.length >= 2;
  return computePositionCount() >= 2;
}

export function updateVersionArrows(): void {
  const isDisabled = !isVersionMovePossible();
  getButton('prevVersionButton').disabled = isDisabled;
  getButton('nextVersionButton').disabled = isDisabled;
  // getButton('deleteVersionButton').disabled = pageState.versions.length === 1;
  const isOnlyVersion = pageState.versions.length === 1;
  getButton('deleteVersionButton').disabled = isOnlyVersion || isBatchLocked();
}
