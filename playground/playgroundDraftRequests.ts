import { dirname } from 'node:path';

export type Draft = { state: string; questions: string };

export function computeDraftPath(historyPath: string): string {
  return `${dirname(historyPath)}/playground-draft.json`;
}

export async function readDraft(historyPath: string): Promise<Draft | null> {
  const draftFile = Bun.file(computeDraftPath(historyPath));
  const isDraftPresent = await draftFile.exists();
  if (!isDraftPresent)
    return null;
  const draft: Draft = await draftFile.json();
  return draft;
}

export async function executeDraftRequest(request: Request, historyPath: string): Promise<Response> {
  const body = (await request.json()) as { state?: unknown; questions?: unknown };
  const { state, questions } = body;
  const isStateString = typeof state === 'string';
  if (!isStateString)
    return new Response('state must be a string', { status: 400 });
  const isQuestionsString = typeof questions === 'string';
  if (!isQuestionsString)
    return new Response('questions must be a string', { status: 400 });
  const draft: Draft = { state, questions };
  await Bun.write(computeDraftPath(historyPath), JSON.stringify(draft));
  return new Response('ok');
}
