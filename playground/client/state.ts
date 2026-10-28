import type { Version } from '../playgroundHistory';
import type { PageState, PendingNotes } from './types';

export function buildEmptyPendingNotes(): PendingNotes {
  return { state: null, questions: null };
}

// export const pageState: PageState = { versions: [], index: 0, fileHandle: null, isDirty: false, pinnedId: null };
// export const pageState: PageState = { versions: [], index: 0, fileHandle: null, isDirty: false, pinnedId: null, editedDraft: null };
export const pageState: PageState = { versions: [], index: 0, fileHandle: null, isDirty: false, pinnedId: null, editedDraft: null, pendingNotes: buildEmptyPendingNotes() };

export function getShownVersion(): Version {
  return pageState.versions[pageState.index];
}
