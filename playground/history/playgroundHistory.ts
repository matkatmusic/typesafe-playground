import type { JsonValue, Questions, SystemOneResult } from '@typesafe-ai/sdk';
import { resolve } from 'node:path';
import { NOT_RUN_TIME } from './notRunTime';
import { HARD_CODED_QUESTIONS, HARD_CODED_STATE } from '../providers/typeSafeQuery';

export const HISTORY_PATH = resolve(import.meta.dir, '..', 'results', 'playground-history.json');

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
  return { time: NOT_RUN_TIME, state: HARD_CODED_STATE, questions: HARD_CODED_QUESTIONS, calls: 0, outputs: [] };
}

export async function initHistory(historyPath: string): Promise<void> {
  const isHistoryPresent = await Bun.file(historyPath).exists();
  if (!isHistoryPresent)
    await writeHistory(historyPath, [buildBlankVersion()]);
}
