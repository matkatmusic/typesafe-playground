import { computeBatchStateError } from './batchPlan';
import { getQuestionsEditor, getStateEditor } from '../editors/editors';
import type { JsonValue, Questions } from '@typesafe-ai/sdk';
import { computeJsonParseResult } from '../editors/jsonParse';
import { isQuestionsObject } from '../editors/jsonObjectGuards';
import { listQuestionsErrors, listStateErrors, listUndefinedReferences } from '../../typesafe-checks/typesafeChecks';

type BatchQuestionsResult =
  | { isValid: true; questions: Questions }
  | { isValid: false; errorMessage: string };

export type BatchInputResult =
  | { isValid: true; states: Record<string, JsonValue>[]; questions: Questions }
  | { isValid: false; errorMessage: string };

function parseBatchQuestions(): BatchQuestionsResult {
  const questionsResult = computeJsonParseResult('questions', getQuestionsEditor().state.doc.toString());
  if (!questionsResult.isValid)
    return { isValid: false, errorMessage: questionsResult.errorMessage };
  const questionsValue = questionsResult.value;
  const isQuestions = isQuestionsObject(questionsValue);
  if (!isQuestions)
    return { isValid: false, errorMessage: 'questions must be a JSON object' };
  return { isValid: true, questions: questionsValue };
}

function listItemReferenceErrors(itemNumber: number, state: Record<string, JsonValue>, questions: Questions): string[] {
  const referenceErrors: string[] = [];
  for (const error of listUndefinedReferences(state, questions))
    referenceErrors.push(`item ${itemNumber}: ${error}`);
  return referenceErrors;
}

function listItemErrors(states: Record<string, JsonValue>[], questions: Questions): string[] {
  // const itemErrors: string[] = [];
  // for (let i = 0; i < states.length; i++) {
  //   for (const error of listSubmitErrors(states[i], questions))
  //     itemErrors.push(`item ${i + 1}: ${error}`);
  // }
  const questionsErrors = listQuestionsErrors(questions);
  const itemErrors: string[] = [...questionsErrors];
  for (let i = 0; i < states.length; i++) {
    const stateErrors = listStateErrors(states[i]);
    for (const error of stateErrors)
      itemErrors.push(`item ${i + 1}: ${error}`);
    // Names are checked only when the state and questions have no shape errors.
    if (stateErrors.length === 0) {
      if (questionsErrors.length === 0)
        itemErrors.push(...listItemReferenceErrors(i + 1, states[i], questions));
    }
  }
  return itemErrors;
}

function buildBatchInputResult(states: Record<string, JsonValue>[], questions: Questions): BatchInputResult {
  const itemErrors = listItemErrors(states, questions);
  const hasItemErrors = itemErrors.length > 0;
  if (hasItemErrors)
    return { isValid: false, errorMessage: itemErrors.join('; ') };
  return { isValid: true, states, questions };
}

export function parseBatchInput(): BatchInputResult {
  const stateResult = computeJsonParseResult('state', getStateEditor().state.doc.toString());
  if (!stateResult.isValid)
    return { isValid: false, errorMessage: stateResult.errorMessage };
  const batchError = computeBatchStateError(stateResult.value);
  if (batchError !== null)
    return { isValid: false, errorMessage: batchError };
  const questionsResult = parseBatchQuestions();
  if (!questionsResult.isValid)
    return { isValid: false, errorMessage: questionsResult.errorMessage };
  // const states = stateResult.value as unknown[];
  const states = stateResult.value as Record<string, JsonValue>[];
  return buildBatchInputResult(states, questionsResult.questions);
}
