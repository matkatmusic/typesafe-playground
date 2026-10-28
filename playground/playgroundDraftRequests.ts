import { dirname } from 'node:path';

export type Draft = { state: string; questions: string };

const SESSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// export function computeDraftPath(historyPath: string): string {
//   return `${dirname(historyPath)}/playground-draft.json`;
// }
export function computeDraftPath(historyPath: string, id: string): string {
  return `${dirname(historyPath)}/.currentSession-${id}.json`;
}

export function isSessionId(id: unknown): id is string {
  if (typeof id !== 'string')
    return false;
  const isUuid = SESSION_ID_PATTERN.test(id);
  return isUuid;
}

// export async function readDraft(historyPath: string): Promise<Draft | null> {
//   const draftFile = Bun.file(computeDraftPath(historyPath));
//   const isDraftPresent = await draftFile.exists();
//   if (!isDraftPresent)
//     return null;
//   const draft: Draft = await draftFile.json();
//   return draft;
// }
export async function readDraft(historyPath: string, id: string): Promise<Draft | null> {
  const draftFile = Bun.file(computeDraftPath(historyPath, id));
  const isDraftPresent = await draftFile.exists();
  if (!isDraftPresent)
    return null;
  const draft: Draft = await draftFile.json();
  return draft;
}

export async function executeDraftRequest(request: Request, historyPath: string): Promise<Response> {
  const body = (await request.json()) as { id?: unknown; state?: unknown; questions?: unknown };
  const { id, state, questions } = body;
  const isIdValid = isSessionId(id);
  if (!isIdValid)
    return new Response('id must be a lowercase uuid', { status: 400 });
  const isStateString = typeof state === 'string';
  if (!isStateString)
    return new Response('state must be a string', { status: 400 });
  const isQuestionsString = typeof questions === 'string';
  if (!isQuestionsString)
    return new Response('questions must be a string', { status: 400 });
  const draft: Draft = { state, questions };
  await Bun.write(computeDraftPath(historyPath, id), JSON.stringify(draft));
  return new Response('ok');
}

export async function executeDraftGetRequest(request: Request, historyPath: string): Promise<Response> {
  const id = new URL(request.url).searchParams.get('id');
  const isIdValid = isSessionId(id);
  if (!isIdValid)
    return new Response('id must be a lowercase uuid', { status: 400 });
  return Response.json(await readDraft(historyPath, id));
}
