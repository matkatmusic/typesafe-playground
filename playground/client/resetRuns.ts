import type { Version } from '../playgroundHistory';
import { markPageChanged } from './pageChanged';
import { applyPinInfo } from './pinInfo';
import { getShownVersion, pageState } from './state';
import { sendJson } from './versionActions';
import { renderShownVersion } from './versionBox';

export async function resetVersionRuns(): Promise<void> {
  const shownVersion = getShownVersion();
  const isConfirmed = confirm(`Erase all runs of version ${shownVersion.id}?`);
  if (!isConfirmed)
    return;
  const response = await sendJson('/reset-runs', { id: shownVersion.id });
  const cleared: Version = await response.json();
  pageState.versions[pageState.index] = cleared;
  const isPinnedVersionCleared = pageState.pinnedId === cleared.id;
  if (isPinnedVersionCleared)
    pageState.pinnedId = null;
  markPageChanged('last edited');
  renderShownVersion();
  applyPinInfo(pageState.pinnedId);
}
