import type { JsonValue, Questions } from '@typesafe-ai/sdk';
import type { Version } from '../playgroundHistory';
import { NOT_RUN_TIME } from '../notRunTime';
import { computeVersionStep } from '../playgroundVersionStep';

export const BATCH_NOT_ARRAY_ERROR = 'state must be an array of objects while batch is on';
export const BATCH_EMPTY_ERROR = 'the state array is empty: add at least one object';
export const SINGLE_ARRAY_ERROR = 'state must be one JSON object: turn on batch to submit an array';

export type BatchVersions = { versions: Version[]; itemIndexes: number[] };

export function computeBatchStateError(value: unknown): string | null {
  if (!Array.isArray(value))
    return BATCH_NOT_ARRAY_ERROR;
  if (value.length === 0)
    return BATCH_EMPTY_ERROR;
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    const isObject = typeof item === 'object' && item !== null;
    if (!isObject)
      return `item ${i + 1} of the state array must be a JSON object`;
    if (Array.isArray(item))
      return `item ${i + 1} of the state array must be a JSON object`;
  }
  return null;
}

// function buildNotRunVersion(state: unknown, questions: unknown): Version {
function buildNotRunVersion(state: Record<string, JsonValue>, questions: Questions): Version {
  return { time: NOT_RUN_TIME, state: state, questions: structuredClone(questions), calls: 0, outputs: [] };
}

// export function buildBatchVersions(versions: Version[], shownIndex: number, states: unknown[], questions: unknown): BatchVersions {
export function buildBatchVersions(versions: Version[], shownIndex: number, states: Record<string, JsonValue>[], questions: Questions): BatchVersions {
  const shownVersion = versions[shownIndex];
  const step = computeVersionStep(shownVersion, states[0], questions);
  const batchVersions = [...versions];
  const itemIndexes: number[] = [];
  if (step === 'create') {
    batchVersions.push(buildNotRunVersion(states[0], questions));
    itemIndexes.push(batchVersions.length - 1);
  }
  if (step === 'overwrite') {
    batchVersions[shownIndex] = { ...shownVersion, state: states[0], questions: structuredClone(questions) };
    itemIndexes.push(shownIndex);
  }
  if (step === 'keep')
    itemIndexes.push(shownIndex);
  for (let i = 1; i < states.length; i++) {
    batchVersions.push(buildNotRunVersion(states[i], questions));
    itemIndexes.push(batchVersions.length - 1);
  }
  return { versions: batchVersions, itemIndexes };
}

export function formatBatchFailures(failures: string[]): string {
  return `Some runs failed:\n${failures.join('\n')}`;
}
