import type { Version } from '../../history/playgroundHistory';
import { computeJsonParseResult } from '../editors/jsonParse';

import { getNotRunTime } from '../../history/notRunTime';

export { getNotRunTime };

export function computeWrappedIndex(index: number, step: number, count: number): number {
    return (index + step + count) % count;
}

export function formatVersionLabel(shownNumber: number, versionCount: number, time: string, calls: number): string {
    const separator = ' · ';
    const callWord = calls === 1 ? 'call' : 'calls';
    const shownTime = time === getNotRunTime() ? time : new Date(time).toLocaleString();
    return `version ${shownNumber} of ${versionCount}${separator}${shownTime}${separator}${calls} ${callWord}`;
}

export function isJsonTextEdited(text: string, savedValue: unknown): boolean {
    const parseResult = computeJsonParseResult('json', text);
    if (!parseResult.isValid)
        return true;
    return JSON.stringify(parseResult.value) !== JSON.stringify(savedValue);
}

export function createEditedVersion(shownVersion: Version): Version {
    return { ...shownVersion, time: getNotRunTime(), calls: 0, outputs: [] };
}
