import type { Version } from '../playgroundHistory';
import type { PinnedData } from './graphTypes';
import type { PinnedValues } from './infoTypes';
import { listAnswers, listOptionKeys, listValues } from './graphValues';

export function findPinned(versions: Version[], pinnedId: number | null): Version | null {
  for (const version of versions) {
    if (version.id === pinnedId)
      return version;
  }
  return null;
}

export function readPinnedData(pinnedVersion: Version | null, name: string): PinnedData | null {
  if (pinnedVersion === null)
    return null;
  const hasRuns = pinnedVersion.outputs.length > 0;
  if (!hasRuns)
    return null;
  const hasQuestion = pinnedVersion.outputs[0].answers[name] !== undefined;
  if (!hasQuestion)
    return null;
  const answers = listAnswers(pinnedVersion, name);
  return { id: pinnedVersion.id, answers: answers, keys: listOptionKeys(answers[0]) };
}

export function readPinnedValues(pinned: PinnedData | null, key: string): PinnedValues | null {
  if (pinned === null)
    return null;
  const hasKey = pinned.keys.includes(key);
  if (!hasKey)
    return null;
  return { id: pinned.id, values: listValues(pinned.answers, key) };
}
