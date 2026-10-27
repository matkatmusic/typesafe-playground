import { buildBlankVersion, loadHistory, writeHistory } from './playgroundHistory';

export function isPlainObject(value: unknown): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isVersionShape(item: unknown): boolean {
  const isItemObject = isPlainObject(item);
  if (!isItemObject)
    return false;
  const { id, state, questions, calls, outputs } = item as Record<string, unknown>;
  return Number.isInteger(id) && isPlainObject(state) && isPlainObject(questions) && Number.isInteger(calls) && Array.isArray(outputs);
}

export async function executeNewRequest(historyPath: string): Promise<Response> {
  await writeHistory(historyPath, [buildBlankVersion()]);
  return Response.json({ versions: await loadHistory(historyPath) });
}

export async function executeOpenRequest(request: Request, historyPath: string): Promise<Response> {
  const body = (await request.json()) as { versions?: unknown };
  const { versions } = body;
  const isVersionsNonEmptyArray = Array.isArray(versions) && versions.length > 0;
  if (!isVersionsNonEmptyArray)
    return new Response('versions must be a non-empty array', { status: 400 });
  for (const item of versions) {
    const isItemValid = isVersionShape(item);
    if (!isItemValid)
      return new Response('each version needs an integer id, object state, object questions, integer calls, and array outputs', { status: 400 });
  }
  await writeHistory(historyPath, versions);
  return Response.json({ versions: versions });
}

export async function executeSaveRequest(historyPath: string): Promise<Response> {
  return Response.json({ versions: await loadHistory(historyPath) });
}
