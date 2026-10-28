import type { Version } from '../playgroundHistory';
import type { PageState } from './types';

// export const pageState: PageState = { versions: [], index: 0, fileHandle: null, isDirty: false, pinnedId: null };
export const pageState: PageState = { versions: [], index: 0, fileHandle: null, isDirty: false, pinnedId: null, editedDraft: null };

export function getShownVersion(): Version {
  return pageState.versions[pageState.index];
}
