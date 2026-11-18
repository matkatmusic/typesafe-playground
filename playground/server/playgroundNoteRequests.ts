import { findVersionByIndex, loadHistory, writeHistory, type Version } from '../history/playgroundHistory';
import { isPlainObject } from './playgroundVersionRequests';

type NoteBody = { index?: unknown; note?: unknown; stateNote?: unknown; questionsNote?: unknown; resultNotes?: unknown };

const STRING_NOTE_FIELDS = ['note', 'stateNote', 'questionsNote'] as const;

function findInvalidResultNotes(resultNotes: unknown): string | undefined {
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

export function findInvalidNoteField(body: NoteBody): string | undefined {
  for (const field of STRING_NOTE_FIELDS) {
    const value = body[field];
    const isInvalid = value !== undefined && typeof value !== 'string';
    if (isInvalid)
      return `${field} must be a string`;
  }
  return findInvalidResultNotes(body.resultNotes);
}


function isAnyNotePresent(body: NoteBody): boolean {
  for (const value of [body.note, body.stateNote, body.questionsNote, body.resultNotes]) {
    const isValuePresent = value !== undefined;
    if (isValuePresent)
      return true;
  }
  return false;
}

function findNoteRequestError(body: NoteBody, foundVersion: Version): string | undefined {
  const isNotePresent = isAnyNotePresent(body);
  if (!isNotePresent)
    return 'a note field must be present';
  const invalidMessage = findInvalidNoteField(body);
  if (invalidMessage !== undefined)
    return invalidMessage;
  const isRunCompleted = foundVersion.outputs.length > 0;
  const isRunNeeded = body.note !== undefined || body.resultNotes !== undefined;
  const isRunMissing = isRunNeeded && !isRunCompleted;
  if (isRunMissing)
    return 'run notes and result notes can only be added to a completed run';
  return undefined;
}

function applyNotesToVersion(foundVersion: Version, body: NoteBody): void {
  const { note, stateNote, questionsNote, resultNotes } = body;
  if (note !== undefined)
    foundVersion.note = note as string;
  if (stateNote !== undefined)
    foundVersion.stateNote = stateNote as string;
  if (questionsNote !== undefined)
    foundVersion.questionsNote = questionsNote as string;
  if (resultNotes !== undefined)
    foundVersion.resultNotes = { ...foundVersion.resultNotes, ...(resultNotes as Record<string, string>) };
}

export async function executeNoteRequest(request: Request, historyPath: string): Promise<Response> {
  const body = (await request.json()) as NoteBody;
  const history: Version[] = await loadHistory(historyPath);
  const foundVersion = findVersionByIndex(history, body.index);
  if (foundVersion === undefined)
    return new Response('index must be the integer index of an existing version', { status: 400 });
  const errorMessage = findNoteRequestError(body, foundVersion);
  if (errorMessage !== undefined)
    return new Response(errorMessage, { status: 400 });
  applyNotesToVersion(foundVersion, body);
  await writeHistory(historyPath, history);
  return Response.json(foundVersion);
}

