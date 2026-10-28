import { loadHistory, writeHistory, type Version } from './playgroundHistory';
import { isPlainObject } from './playgroundVersionRequests';

type NoteBody = { id?: unknown; note?: unknown; stateNote?: unknown; questionsNote?: unknown; resultNotes?: unknown };

const STRING_NOTE_FIELDS = ['note', 'stateNote', 'questionsNote'] as const;

export function findInvalidNoteField(body: NoteBody): string | undefined {
  for (const field of STRING_NOTE_FIELDS) {
    const value = body[field];
    const isInvalid = value !== undefined && typeof value !== 'string';
    if (isInvalid)
      return `${field} must be a string`;
  }
  const { resultNotes } = body;
  if (resultNotes === undefined)
    return undefined;
  const isResultNotesObject = isPlainObject(resultNotes);
  if (!isResultNotesObject)
    return 'resultNotes must be an object';
  for (const value of Object.values(resultNotes as object)) {
    if (typeof value !== 'string')
      return 'each resultNotes value must be a string';
  }
  return undefined;
}

export async function executeNoteRequest(request: Request, historyPath: string): Promise<Response> {
  const body = (await request.json()) as NoteBody;
  const { id, note, stateNote, questionsNote, resultNotes } = body;
  const history: Version[] = await loadHistory(historyPath);
  let foundVersion: Version | undefined;
  for (const version of history) {
    if (version.id === id)
      foundVersion = version;
  }
  if (foundVersion === undefined)
    return new Response('id must be the integer id of an existing version', { status: 400 });
  let isAnyNotePresent = false;
  for (const value of [note, stateNote, questionsNote, resultNotes]) {
    const isValuePresent = value !== undefined;
    if (isValuePresent)
      isAnyNotePresent = true;
  }
  if (!isAnyNotePresent)
    return new Response('a note field must be present', { status: 400 });
  const invalidMessage = findInvalidNoteField(body);
  if (invalidMessage !== undefined)
    return new Response(invalidMessage, { status: 400 });
  const isRunCompleted = foundVersion.outputs.length > 0;
  const isRunNeeded = note !== undefined || resultNotes !== undefined;
  const isRunMissing = isRunNeeded && !isRunCompleted;
  if (isRunMissing)
    return new Response('run notes and result notes can only be added to a completed run', { status: 400 });
  if (note !== undefined)
    foundVersion.note = note as string;
  if (stateNote !== undefined)
    foundVersion.stateNote = stateNote as string;
  if (questionsNote !== undefined)
    foundVersion.questionsNote = questionsNote as string;
  if (resultNotes !== undefined)
    foundVersion.resultNotes = { ...foundVersion.resultNotes, ...(resultNotes as Record<string, string>) };
  await writeHistory(historyPath, history);
  return Response.json(foundVersion);
}
