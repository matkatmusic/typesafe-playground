import { getElement } from './dom';
import { graphState } from './graphState';
import { renderGraphs } from './graphs';
import { readQuestions } from './graphValues';
import { attachInfoBox } from './infoBox';
import { getShownVersion } from './state';

export function updateCollapsedNames(names: string[], isCollapsed: boolean): void {
  for (const name of names)
    graphState.collapsedByName[name] = isCollapsed;
}

export function setAllGraphsCollapsed(isCollapsed: boolean): void {
  const version = getShownVersion();
  updateCollapsedNames(Object.keys(readQuestions(version)), isCollapsed);
  renderGraphs(version, getElement('graphContainerBox'), attachInfoBox);
}

export function setAllGraphsToCollapsed(): void {
  setAllGraphsCollapsed(true);
}

export function setAllGraphsToExpanded(): void {
  setAllGraphsCollapsed(false);
}
