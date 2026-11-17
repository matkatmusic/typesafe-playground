import type { Version } from '../../history/playgroundHistory';
import { markPageChanged } from '../page/pageChanged';
import { applyPinInfo } from '../pins/pinInfo';
import { buildEmptyPendingNotes, pageState } from '../page/state';
import { sendJson } from './versionActions';
import { renderShownVersion } from './versionBox';

export const DELETE_CONFIRM_TEXT = 'Are you sure you want to delete this version (state, questions, results, notes, comments) from this session?';

function getVersionsWithoutIndex(versions: Version[], deletedIndex: number): Version[] {
  const remainingVersions: Version[] = [];
  for (const [index, version] of versions.entries()) {
    const isKept = index !== deletedIndex;
    if (isKept)
      remainingVersions.push(version);
  }
  return remainingVersions;
}

function resetPageStateToVersions(versions: Version[], deletedIndex: number): void {
  pageState.versions = versions;
  pageState.index = Math.min(deletedIndex, versions.length - 1);
  pageState.editedDraft = null;
  pageState.pendingNotes = buildEmptyPendingNotes();
}

function updatePinnedIndexAfterDelete(deletedIndex: number): void {
  const pinnedIndex = pageState.pinnedIndex;
  if (pinnedIndex !== null) {
    if (pinnedIndex === deletedIndex)
      pageState.pinnedIndex = null;
    else if (pinnedIndex > deletedIndex)
      pageState.pinnedIndex = pinnedIndex - 1;
  }
}

export async function removeShownVersion(): Promise<void> {
  const isConfirmed = confirm(DELETE_CONFIRM_TEXT);
  if (!isConfirmed)
    return;
  const deletedIndex = pageState.index;
  const remainingVersions = getVersionsWithoutIndex(pageState.versions, deletedIndex);
  const response = await sendJson('/open', { versions: remainingVersions });
  const opened: { versions: Version[] } = await response.json();
  resetPageStateToVersions(opened.versions, deletedIndex);
  updatePinnedIndexAfterDelete(deletedIndex);
  markPageChanged('last edited');
  renderShownVersion();
  applyPinInfo(pageState.pinnedIndex);
}
