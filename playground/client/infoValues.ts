import type { Question } from '@typesafe-ai/sdk';
import type { Answer } from './graphTypes';
import { formatValueText, NOUL_KEY, readValue } from './graphValues';

export const NOUL_NO_KEY = 'no';

export function readConfidence(answer: Answer): number {
  if (answer.type === 'noul')
    throw new Error('a noul answer has no confidence');
  return answer.confidence;
}

export function readTopKey(answer: Answer, keys: string[]): string {
  if (answer.type === 'choice')
    return answer.choice;
  if (answer.type === 'noul')
    // return answer.noul > 0.5 ? NOUL_KEY : NOUL_NO_KEY;
    return answer.noul >= 0.5 ? NOUL_KEY : NOUL_NO_KEY;
  let topKey = keys[0];
  for (const key of keys) {
    const keyValue = readValue(answer, key);
    const topValue = readValue(answer, topKey);
    if (keyValue > topValue)
      topKey = key;
  }
  return topKey;
}

export function readDescription(question: Question, key: string): string {
  if (question.type === 'noul') {
    const criteria = question.criteria;
    const isCriteriaMissing = criteria === undefined || criteria === null;
    if (isCriteriaMissing)
      return '(none)';
    return formatValueText(key === NOUL_KEY ? criteria.true : criteria.false);
  }
  if (question.type === 'score')
    return formatValueText(question.criteria[Number(key)]);
  return formatValueText(question.criteria[key]);
}
