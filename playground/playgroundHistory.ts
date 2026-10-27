import type { Questions, SystemOneResult } from '@typesafe-ai/sdk';
import { HARD_CODED_QUESTIONS, HARD_CODED_STATE } from './typeSafeQuery';

export const HISTORY_PATH = `${import.meta.dir}/results/playground-history.json`;

export type RunOutput = SystemOneResult<Questions>;
export type Version = { id: number; time: string; state: unknown; questions: unknown; calls: number; outputs: RunOutput[]; note?: string };

export async function loadHistory(historyPath: string): Promise<Version[]> {
  const history: Version[] = await Bun.file(historyPath).json();
  return history;
}

export async function writeHistory(historyPath: string, versions: Version[]): Promise<void> {
  await Bun.write(historyPath, JSON.stringify(versions, null, 2) + '\n');
}

export function buildBlankVersion(): Version {
  return { id: 1, time: new Date().toISOString(), state: HARD_CODED_STATE, questions: HARD_CODED_QUESTIONS, calls: 0, outputs: [] };
}

export async function initHistory(historyPath: string): Promise<void> {
  const isHistoryPresent = await Bun.file(historyPath).exists();
  if (!isHistoryPresent)
    await writeHistory(historyPath, [buildBlankVersion()]);
}
