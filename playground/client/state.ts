import type { Version } from '../playgroundHistory';
import type { PageState, PendingNotes } from './types';

export function buildEmptyPendingNotes(): PendingNotes {
  return { state: null, questions: null };
}

// export const pageState: PageState = { versions: [], index: 0, fileHandle: null, isDirty: false, pinnedId: null };
// export const pageState: PageState = { versions: [], index: 0, fileHandle: null, isDirty: false, pinnedId: null, editedDraft: null };
// export const pageState: PageState = { versions: [], index: 0, fileHandle: null, isDirty: false, pinnedId: null, editedDraft: null, pendingNotes: buildEmptyPendingNotes() };
// export const pageState: PageState = { versions: [], index: 0, fileHandle: null, isDirty: false, pinnedIndex: null, editedDraft: null, pendingNotes: buildEmptyPendingNotes() };
export const pageState: PageState = { versions: [], index: 0, fileHandle: null, isDirty: false, pinnedIndex: null, editedDraft: null, pendingNotes: buildEmptyPendingNotes(), isBatchOn: false, batchRun: null };

export function isBatchLocked(): boolean {
  return pageState.isBatchOn || pageState.batchRun !== null;
}

export function getShownVersion(): Version {
  return pageState.versions[pageState.index];
}
