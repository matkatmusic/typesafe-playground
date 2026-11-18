import { getElement } from '../page/dom';
import { renderGraphs } from '../graphs/graphs';
import { attachInfoBox } from '../infoBox/infoBox';
import { applyPinButtons } from './pinButtons';
import { applyPinInfo } from './pinInfo';
import { getShownVersion, pageState } from '../page/state';

function renderPin(): void {
  applyPinInfo(pageState.pinnedIndex);
  applyPinButtons();
  renderGraphs(getShownVersion(), getElement('graphContainerBox'), attachInfoBox);
}

export function setPinnedToShown(): void {
  pageState.pinnedIndex = pageState.index;
  renderPin();
}

export function clearPinned(): void {
  pageState.pinnedIndex = null;
  renderPin();
}
