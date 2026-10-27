import type { ViewUpdate } from '@codemirror/view';
import { getElement } from './dom';
import { computeJsonParseResult } from './jsonParse';

export const STATE_ERROR_PREFIX = 'state is not valid JSON';
export const QUESTIONS_ERROR_PREFIX = 'questions is not valid JSON';

function clearJsonErrorWhenFixed(label: string, update: ViewUpdate): void {
  if (!update.docChanged)
    return;
  const errorLine = getElement('errorLine');
  const isOwnError = (errorLine.textContent ?? '').startsWith(`${label} is not valid JSON`);
  if (!isOwnError)
    return;
  const parseResult = computeJsonParseResult(label, update.state.doc.toString());
  if (parseResult.isValid)
    errorLine.textContent = '';
}

export function clearStateJsonError(update: ViewUpdate): void {
  clearJsonErrorWhenFixed('state', update);
}

export function clearQuestionsJsonError(update: ViewUpdate): void {
  clearJsonErrorWhenFixed('questions', update);
}
