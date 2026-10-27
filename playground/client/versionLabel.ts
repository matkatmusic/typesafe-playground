import type { Version } from '../playgroundHistory';
import { computeJsonParseResult } from './jsonParse';

export const NOT_RUN_TIME = 'not run yet';
const SEPARATOR = ' · ';

export function computeWrappedIndex(index: number, step: number, count: number): number {
  return (index + step + count) % count;
}

export function formatVersionLabel(shownNumber: number, versionCount: number, time: string, calls: number): string {
  const callWord = calls === 1 ? 'call' : 'calls';
  return `version ${shownNumber} of ${versionCount}${SEPARATOR}${time}${SEPARATOR}${calls} ${callWord}`;
}

export function isStateEdited(stateText: string, version: Version): boolean {
  const stateResult = computeJsonParseResult('state', stateText);
  if (!stateResult.isValid)
    return true;
  return JSON.stringify(stateResult.value) !== JSON.stringify(version.state);
}

export function createEditedVersion(shownVersion: Version, versionCount: number): Version {
  return { ...shownVersion, id: versionCount + 1, time: NOT_RUN_TIME, calls: 0, outputs: [] };
}
