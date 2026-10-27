import { getButton } from './dom';
import { pageState } from './state';

export function isVersionMovePossible(): boolean {
  return pageState.versions.length >= 2;
}

export function updateVersionArrows(): void {
  const isDisabled = !isVersionMovePossible();
  getButton('prevVersionButton').disabled = isDisabled;
  getButton('nextVersionButton').disabled = isDisabled;
}
