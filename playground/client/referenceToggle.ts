import { getElement, getInput } from './dom';
import { graphState } from './graphState';
import { renderGraphs } from './graphs';
import { attachInfoBox } from './infoBox';
import { getShownVersion } from './state';

export function updateReferencesReplaced(): void {
  graphState.isReferencesReplaced = getInput('replaceReferencesCheckbox').checked;
  renderGraphs(getShownVersion(), getElement('graphContainerBox'), attachInfoBox);
}
