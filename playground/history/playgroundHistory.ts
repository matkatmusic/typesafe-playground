import type { JsonValue, Questions, SystemOneResult } from '@typesafe-ai/sdk';
import { resolve } from 'node:path';
import { getNotRunTime } from './notRunTime';
import { getHardCodedQuestions, getHardCodedState } from '../providers/typeSafeQuery';

export function getHistoryPath(): string {
    return resolve(import.meta.dir, '..', 'results', 'playground-history.json');
}

export type Provider = 'TypeSafe' | 'SubQ';
export type RunOutput = SystemOneResult<Questions> & { provider?: Provider };
export interface Version { time: string; state: Record<string, JsonValue>; questions: Questions; calls: number; outputs: RunOutput[]; note?: string; stateNote?: string; questionsNote?: string; resultNotes?: Record<string, string> }

export async function loadHistory(historyPath: string): Promise<Version[]> {
    const history: Version[] = await Bun.file(historyPath).json();
    for (const version of history)
        Reflect.deleteProperty(version, 'id');
    return history;
}

export function findVersionByIndex(history: Version[], index: unknown): Version | undefined {
    const isIndexInteger = Number.isInteger(index);
    if (!isIndexInteger)
        return undefined;
    return history[index as number];
}

export async function writeHistory(historyPath: string, versions: Version[]): Promise<void> {
    await Bun.write(historyPath, JSON.stringify(versions, null, 2) + '\n');
}

export function buildBlankVersion(): Version {
    return { time: getNotRunTime(), state: getHardCodedState(), questions: getHardCodedQuestions(), calls: 0, outputs: [] };
}

export async function initHistory(historyPath: string): Promise<void> {
    const isHistoryPresent = await Bun.file(historyPath).exists();
    if (!isHistoryPresent)
        await writeHistory(historyPath, [buildBlankVersion()]);
}
