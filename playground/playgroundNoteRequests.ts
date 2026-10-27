import { loadHistory, writeHistory, type Version } from './playgroundHistory';

export async function executeNoteRequest(request: Request, historyPath: string): Promise<Response> {
  const body = (await request.json()) as { id?: unknown; note?: unknown };
  const { id, note } = body;
  const history: Version[] = await loadHistory(historyPath);
  let foundVersion: Version | undefined;
  for (const version of history) {
    if (version.id === id)
      foundVersion = version;
  }
  if (foundVersion === undefined)
    return new Response('id must be the integer id of an existing version', { status: 400 });
  const isNoteString = typeof note === 'string';
  if (!isNoteString)
    return new Response('note must be a string', { status: 400 });
  const isRunCompleted = foundVersion.outputs.length > 0;
  if (!isRunCompleted)
    return new Response('notes can only be added to a completed run', { status: 400 });
  foundVersion.note = note;
  await writeHistory(historyPath, history);
  return Response.json(foundVersion);
}
