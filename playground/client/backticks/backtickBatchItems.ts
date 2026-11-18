import type { EditorState } from '@codemirror/state';
import { computeJsonParseResult } from '../editors/jsonParse';
import { pageState } from '../page/state';

export function listBatchItems(states: EditorState[]): unknown[] | null {
    if (!pageState.isBatchOn)
        return null;
    const stateParse = computeJsonParseResult('state', states[0].doc.toString());
    if (!stateParse.isValid)
        return null;
    const items = stateParse.value;
    const isItemsArray = Array.isArray(items);
    if (!isItemsArray)
        return null;
    if (items.length === 0)
        return null;
    return items;
}

