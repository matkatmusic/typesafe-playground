import { getElement } from './dom';
import { renderGraphs } from './graphs';
import { attachInfoBox } from './infoBox';
import { applyPinButtons } from './pinButtons';
import { applyPinInfo } from './pinInfo';
import { getShownVersion, pageState } from './state';

function renderPin(): void {
  applyPinInfo(pageState.pinnedIndex);
  applyPinButtons();
  renderGraphs(getShownVersion(), getElement('graphContainerBox'), attachInfoBox);
}

export function setPinnedToShown(): void {
  // const isAlreadyPinned = pageState.pinnedId !== null;
  // if (isAlreadyPinned)
  //   return;
  // pageState.pinnedId = getShownVersion().id;
  pageState.pinnedIndex = pageState.index;
  renderPin();
}

export function clearPinned(): void {
  pageState.pinnedIndex = null;
  renderPin();
}
