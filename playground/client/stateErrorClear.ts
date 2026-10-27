import type { ViewUpdate } from '@codemirror/view';
import { getElement } from './dom';
import { computeJsonParseResult } from './jsonParse';

export const STATE_ERROR_PREFIX = 'state is not valid JSON';

export function clearStateJsonError(update: ViewUpdate): void {
  if (!update.docChanged)
    return;
  const errorLine = getElement('errorLine');
  const isStateError = (errorLine.textContent ?? '').startsWith(STATE_ERROR_PREFIX);
  if (!isStateError)
    return;
  const stateResult = computeJsonParseResult('state', update.state.doc.toString());
  if (stateResult.isValid)
    errorLine.textContent = '';
}
