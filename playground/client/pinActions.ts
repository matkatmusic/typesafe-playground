import { getElement } from './dom';
import { renderGraphs } from './graphs';
import { attachInfoBox } from './infoBox';
import { applyPinInfo } from './pinInfo';
import { getShownVersion, pageState } from './state';

function renderPin(): void {
  applyPinInfo(pageState.pinnedId);
  renderGraphs(getShownVersion(), getElement('graphContainerBox'), attachInfoBox);
}

export function setPinnedToShown(): void {
  pageState.pinnedId = getShownVersion().id;
  renderPin();
}

export function clearPinned(): void {
  pageState.pinnedId = null;
  renderPin();
}
