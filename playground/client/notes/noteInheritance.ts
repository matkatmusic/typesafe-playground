export function computeInheritedNote(pending: string | null, baseNote: string | undefined, isUnchanged: boolean): string | undefined {
  if (pending !== null)
    return pending;
  if (isUnchanged)
    return baseNote;
  return undefined;
}

export function computeNoteStartText(isEdited: boolean, savedNote: string | undefined, pending: string | null, isUnchanged: boolean): string {
  if (!isEdited)
    return savedNote ?? '';
  return computeInheritedNote(pending, savedNote, isUnchanged) ?? '';
}
