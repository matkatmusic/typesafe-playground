import type { Version } from '../../history/playgroundHistory';
import type { PageState, PendingNotes } from './types';

export function buildEmptyPendingNotes(): PendingNotes {
    return { state: null, questions: null };
}

export class pageState {
    public static versions: PageState['versions'] = [];
    public static index: PageState['index'] = 0;
    public static fileHandle: PageState['fileHandle'] = null;
    public static isDirty: PageState['isDirty'] = false;
    public static pinnedIndex: PageState['pinnedIndex'] = null;
    public static editedDraft: PageState['editedDraft'] = null;
    public static pendingNotes: PageState['pendingNotes'] = buildEmptyPendingNotes();
    public static isBatchOn: PageState['isBatchOn'] = false;
    public static batchRun: PageState['batchRun'] = null;
    private static instance: pageState | undefined;

    private constructor() {}

    public static getInstance(): pageState {
        if (pageState.instance === undefined) {
            pageState.instance = new pageState();
        }
        return pageState.instance;
    }
}

export function isBatchLocked(): boolean {
    return pageState.isBatchOn || pageState.batchRun !== null;
}

export function getShownVersion(): Version {
    return pageState.versions[pageState.index];
}
