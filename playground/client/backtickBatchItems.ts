import type { EditorState } from '@codemirror/state';
import { computeJsonParseResult } from './jsonParse';
import { pageState } from './state';

export function listBatchItems(states: EditorState[]): unknown[] | null {
  if (!pageState.isBatchOn)
    return null;
  const stateParse = computeJsonParseResult('state', states[0].doc.toString());
  if (!stateParse.isValid)
    return null;
  const items = stateParse.value;
  if (!Array.isArray(items))
    return null;
  if (items.length === 0)
    return null;
  return items;
}

// export function isNameDefinedInBatch(questionsState: EditorState, items: unknown[], keyName: string): boolean {
//   const isDefinedByQuestions = isNameDefined([questionsState], keyName);
//   if (isDefinedByQuestions)
//     return true;
//   for (const item of items) {
//     const isInItem = findPathValue(item, keyName).isFound;
//     if (!isInItem)
//       return false;
//   }
//   return true;
// }
