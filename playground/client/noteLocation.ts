import type { Version } from '../playgroundHistory';
import type { NoteKind } from './noteKind';

export type NoteLocation = { kind: NoteKind } | { kind: 'result'; question: string };

export function readSavedNote(version: Version, location: NoteLocation): string | undefined {
  if (location.kind === 'result')
    return version.resultNotes?.[location.question];
  const field = `${location.kind}Note` as const;
  return version[field];
}

export function buildNoteBody(location: NoteLocation, text: string): Record<string, unknown> {
  if (location.kind === 'result')
    return { resultNotes: { [location.question]: text } };
  return { [`${location.kind}Note`]: text };
}

export function storeSavedNote(version: Version, saved: Version, location: NoteLocation): void {
  if (location.kind === 'result') {
    version.resultNotes = saved.resultNotes;
    return;
  }
  const field = `${location.kind}Note` as const;
  version[field] = saved[field];
}
