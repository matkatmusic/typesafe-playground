import { getElement, getInput } from './dom';
import { graphState } from './graphState';
import { renderGraphs } from './graphs';
import { attachInfoBox } from './infoBox';
import { getShownVersion } from './state';
import { renderWinners } from './winnersDom';

export function updateReferencesReplaced(): void {
  graphState.isReferencesReplaced = getInput('replaceReferencesCheckbox').checked;
  renderGraphs(getShownVersion(), getElement('graphContainerBox'), attachInfoBox);
  renderWinners(getShownVersion(), getElement('winnerBox'));
}
