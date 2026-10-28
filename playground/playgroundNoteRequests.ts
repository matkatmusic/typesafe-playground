import { loadHistory, writeHistory, type Version } from './playgroundHistory';

export async function executeNoteRequest(request: Request, historyPath: string): Promise<Response> {
  const body = (await request.json()) as { id?: unknown; note?: unknown; stateNote?: unknown };
  const { id, note, stateNote } = body;
  const history: Version[] = await loadHistory(historyPath);
  let foundVersion: Version | undefined;
  for (const version of history) {
    if (version.id === id)
      foundVersion = version;
  }
  if (foundVersion === undefined)
    return new Response('id must be the integer id of an existing version', { status: 400 });
  const isNotePresent = note !== undefined;
  const isStateNotePresent = stateNote !== undefined;
  const isAnyNotePresent = isNotePresent || isStateNotePresent;
  if (!isAnyNotePresent)
    return new Response('note or stateNote must be present', { status: 400 });
  const isNoteInvalid = isNotePresent && typeof note !== 'string';
  if (isNoteInvalid)
    return new Response('note must be a string', { status: 400 });
  const isStateNoteInvalid = isStateNotePresent && typeof stateNote !== 'string';
  if (isStateNoteInvalid)
    return new Response('stateNote must be a string', { status: 400 });
  const isRunCompleted = foundVersion.outputs.length > 0;
  const isRunMissing = isNotePresent && !isRunCompleted;
  if (isRunMissing)
    return new Response('notes can only be added to a completed run', { status: 400 });
  if (isNotePresent)
    foundVersion.note = note as string;
  if (isStateNotePresent)
    foundVersion.stateNote = stateNote as string;
  await writeHistory(historyPath, history);
  return Response.json(foundVersion);
}
