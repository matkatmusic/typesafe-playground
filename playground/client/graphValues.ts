import type { EntryType, Questions } from '@typesafe-ai/sdk';
import type { Version } from '../playgroundHistory';
import type { Answer, ProbabilityTable, Summary } from './graphTypes';

export const NOUL_KEY = 'yes';

export function formatValueText(value: EntryType | undefined): string {
  const isMissing = value === undefined || value === null;
  if (isMissing)
    return '(none)';
  if (typeof value === 'string')
    return value;
  return JSON.stringify(value);
}

export function readQuestions(version: Version): Questions {
  const questions = version.questions;
  const isObject = typeof questions === 'object' && questions !== null;
  const isArray = Array.isArray(questions);
  const isPlainObject = isObject && !isArray;
  if (!isPlainObject)
    throw new Error('version questions must be a JSON object');
  return questions as Questions;
}

export function listOptionKeys(firstAnswer: Answer): string[] {
  if (firstAnswer.type === 'noul')
    return [NOUL_KEY];
  return Object.keys(firstAnswer.probabilities);
}

export function readValue(answer: Answer, key: string): number {
  if (answer.type === 'noul') {
    if (key !== NOUL_KEY)
      throw new Error(`a noul answer has only the ${NOUL_KEY} option, not ${key}`);
    return answer.noul;
  }
  const table: ProbabilityTable = answer.probabilities;
  const isKeyMissing = !(key in table);
  if (isKeyMissing)
    throw new Error(`answer has no probability for ${key}`);
  return table[key];
}

export function listValues(answers: Answer[], key: string): number[] {
  const values: number[] = [];
  for (const answer of answers)
    values.push(readValue(answer, key));
  return values;
}

export function computeSummary(values: number[]): Summary {
  let low = values[0];
  let high = values[0];
  let sum = 0;
  for (const value of values) {
    if (value < low)
      low = value;
    if (value > high)
      high = value;
    sum += value;
  }
  return { low: low, high: high, average: sum / values.length };
}

export function listAnswers(version: Version, name: string): Answer[] {
  const answers: Answer[] = [];
  for (const output of version.outputs)
    answers.push(output.answers[name]);
  return answers;
}
