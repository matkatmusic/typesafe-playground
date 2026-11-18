import { getElement, getInput } from '../page/dom';
import { graphState } from '../graphs/graphState';
import { renderGraphs } from '../graphs/graphs';
import { attachInfoBox } from '../infoBox/infoBox';
import { getShownVersion } from '../page/state';
import { renderWinners } from '../runs/winnersDom';

export function updateReferencesReplaced(): void {
    graphState.isReferencesReplaced = getInput('replaceReferencesCheckbox').checked;
    renderGraphs(getShownVersion(), getElement('graphContainerBox'), attachInfoBox);
    renderWinners(getShownVersion(), getElement('winnerBox'));
}
