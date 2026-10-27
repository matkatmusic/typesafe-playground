import type { Version } from '../playgroundHistory';
import { computeJsonParseResult } from './jsonParse';

export const NOT_RUN_TIME = 'not run yet';
const SEPARATOR = ' · ';

export function computeWrappedIndex(index: number, step: number, count: number): number {
  return (index + step + count) % count;
}

export function formatVersionLabel(shownNumber: number, versionCount: number, time: string, calls: number): string {
  const callWord = calls === 1 ? 'call' : 'calls';
  const shownTime = time === NOT_RUN_TIME ? time : new Date(time).toLocaleString();
  return `version ${shownNumber} of ${versionCount}${SEPARATOR}${shownTime}${SEPARATOR}${calls} ${callWord}`;
}

export function isJsonTextEdited(text: string, savedValue: unknown): boolean {
  const parseResult = computeJsonParseResult('json', text);
  if (!parseResult.isValid)
    return true;
  return JSON.stringify(parseResult.value) !== JSON.stringify(savedValue);
}

export function createEditedVersion(shownVersion: Version, versionCount: number): Version {
  return { ...shownVersion, id: versionCount + 1, time: NOT_RUN_TIME, calls: 0, outputs: [] };
}
