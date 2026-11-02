import type { Version } from '../playgroundHistory';
import { markPageChanged } from './pageChanged';
import { applyPinInfo } from './pinInfo';
import { pageState } from './state';
import { sendJson } from './versionActions';
import { renderShownVersion } from './versionBox';

export async function resetVersionRuns(): Promise<void> {
  // const isConfirmed = confirm(`Erase all runs of version ${shownVersion.id}?`);
  const isConfirmed = confirm(`Erase all runs of version ${pageState.index + 1}?`);
  if (!isConfirmed)
    return;
  // const response = await sendJson('/reset-runs', { id: shownVersion.id });
  const response = await sendJson('/reset-runs', { index: pageState.index });
  const cleared: Version = await response.json();
  pageState.versions[pageState.index] = cleared;
  // const isPinnedVersionCleared = pageState.pinnedId === cleared.id;
  const isPinnedVersionCleared = pageState.pinnedIndex === pageState.index;
  if (isPinnedVersionCleared)
    pageState.pinnedIndex = null;
  markPageChanged('last edited');
  renderShownVersion();
  applyPinInfo(pageState.pinnedIndex);
}
