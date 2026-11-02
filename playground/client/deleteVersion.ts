import type { Version } from '../playgroundHistory';
import { markPageChanged } from './pageChanged';
import { applyPinInfo } from './pinInfo';
import { buildEmptyPendingNotes, pageState } from './state';
import { sendJson } from './versionActions';
import { renderShownVersion } from './versionBox';

export const DELETE_CONFIRM_TEXT = 'Are you sure you want to delete this version (state, questions, results, notes, comments) from this session?';

export async function deleteShownVersion(): Promise<void> {
  const isConfirmed = confirm(DELETE_CONFIRM_TEXT);
  if (!isConfirmed)
    return;
  const deletedIndex = pageState.index;
  const remainingVersions = pageState.versions.filter((_version, index) => index !== deletedIndex);
  const response = await sendJson('/open', { versions: remainingVersions });
  const opened: { versions: Version[] } = await response.json();
  pageState.versions = opened.versions;
  pageState.index = Math.min(deletedIndex, opened.versions.length - 1);
  pageState.editedDraft = null;
  pageState.pendingNotes = buildEmptyPendingNotes();
  const pinnedIndex = pageState.pinnedIndex;
  if (pinnedIndex !== null) {
    if (pinnedIndex === deletedIndex)
      pageState.pinnedIndex = null;
    else if (pinnedIndex > deletedIndex)
      pageState.pinnedIndex = pinnedIndex - 1;
  }
  markPageChanged('last edited');
  renderShownVersion();
  applyPinInfo(pageState.pinnedIndex);
}
