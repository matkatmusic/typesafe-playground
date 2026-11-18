import type { JsonValue, Questions } from '@typesafe-ai/sdk';
import type { Version } from '../../history/playgroundHistory';
import { getNotRunTime } from '../../history/notRunTime';
import { computeVersionStep } from '../../history/playgroundVersionStep';

export interface BatchVersions { versions: Version[]; itemIndexes: number[] }

export function getSingleArrayError(): string {
    return 'state must be one JSON object: turn on batch to submit an array';
}

export function computeBatchStateError(value: unknown): string | null {
    const isArray = Array.isArray(value);
    if (!isArray)
        return 'state must be an array of objects while batch is on';
    if (value.length === 0)
        return 'the state array is empty: add at least one object';
    for (let i = 0; i < value.length; i++) {
        const item = value[i];
        const isObject = typeof item === 'object' && item !== null;
        const isPlainObject = isObject && !Array.isArray(item);
        if (!isPlainObject)
            return `item ${i + 1} of the state array must be a JSON object`;
    }
    return null;
}

function buildNotRunVersion(state: Record<string, JsonValue>, questions: Questions): Version {
    return { time: getNotRunTime(), state: state, questions: structuredClone(questions), calls: 0, outputs: [] };
}

function applyFirstStateStep(batchVersions: Version[], itemIndexes: number[], shownIndex: number, firstState: Record<string, JsonValue>, questions: Questions): void {
    const shownVersion = batchVersions[shownIndex];
    const step = computeVersionStep(shownVersion, firstState, questions);
    if (step === 'create') {
        batchVersions.push(buildNotRunVersion(firstState, questions));
        itemIndexes.push(batchVersions.length - 1);
    }
    if (step === 'overwrite') {
        batchVersions[shownIndex] = { ...shownVersion, state: firstState, questions: structuredClone(questions) };
        itemIndexes.push(shownIndex);
    }
    if (step === 'keep')
        itemIndexes.push(shownIndex);
}

export function buildBatchVersions(versions: Version[], shownIndex: number, states: Record<string, JsonValue>[], questions: Questions): BatchVersions {
    const batchVersions = [...versions];
    const itemIndexes: number[] = [];
    applyFirstStateStep(batchVersions, itemIndexes, shownIndex, states[0], questions);
    for (let i = 1; i < states.length; i++) {
        batchVersions.push(buildNotRunVersion(states[i], questions));
        itemIndexes.push(batchVersions.length - 1);
    }
    return { versions: batchVersions, itemIndexes };
}

export function formatBatchFailures(failures: string[]): string {
    return `Some runs failed:\n${failures.join('\n')}`;
}
