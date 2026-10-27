import { TypeSafeClient, type Questions, type EntryType, type JsonValue } from '@typesafe-ai/sdk';
import { loadHistory, writeHistory, type RunOutput, type Version } from './playgroundHistory';
import { isPlainObject } from './playgroundVersionRequests';
import { setLastTypedKey } from './serverErrors';
import { HARD_CODED_QUESTIONS } from './typeSafeQuery';

export const MISSING_KEY_MESSAGE = 'Add a TypeSafe API key';
export const MIN_CALLS = 1;
export const MAX_CALLS = 10;

export type RunClient = {
  systemOne(request: { state: EntryType; questions: Questions }): Promise<RunOutput>;
};
export type CreateRunClient = (apiKey: string) => RunClient;

export function createTypeSafeClient(apiKey: string): RunClient {
  return new TypeSafeClient({ apiKey });
}

export function selectApiKey(typedKey: string, envKey: string): string {
  if (typedKey !== '')
    return typedKey;
  return envKey;
}

export function isCallsInRange(calls: unknown): calls is number {
  if (typeof calls !== 'number')
    return false;
  const isInteger = Number.isInteger(calls);
  if (!isInteger)
    return false;
  if (calls < MIN_CALLS)
    return false;
  return calls <= MAX_CALLS;
}

export async function collectOutputs(client: RunClient, calls: number, state: Record<string, JsonValue>): Promise<RunOutput[]> {
  const outputs: RunOutput[] = [];
  for (let i = 0; i < calls; i++)
    outputs.push(await client.systemOne({ state: state, questions: HARD_CODED_QUESTIONS }));
  return outputs;
}

export function isInputUnchanged(version: Version, state: unknown): boolean {
  const versionStateText = JSON.stringify(version.state);
  const stateText = JSON.stringify(state);
  const isStateSame = versionStateText === stateText;
  if (!isStateSame)
    return false;
  const versionQuestionsText = JSON.stringify(version.questions);
  const questionsText = JSON.stringify(HARD_CODED_QUESTIONS);
  return versionQuestionsText === questionsText;
}

export function findVersionById(history: Version[], id: unknown): Version | undefined {
  for (const version of history) {
    if (version.id === id)
      return version;
  }
  return undefined;
}

export function addRunToHistory(history: Version[], shownVersion: Version, outputs: RunOutput[], state: unknown): Version {
  const lastVersion = history[history.length - 1];
  const isUnchanged = isInputUnchanged(shownVersion, state);
  if (isUnchanged) {
    shownVersion.outputs.push(...outputs);
    shownVersion.calls += outputs.length;
    return shownVersion;
  }
  const version: Version = { id: lastVersion.id + 1, time: new Date().toISOString(), state: state, questions: HARD_CODED_QUESTIONS, calls: outputs.length, outputs };
  history.push(version);
  return version;
}

export async function executeRunRequest(request: Request, createClient: CreateRunClient, historyPath: string): Promise<Response> {
  const body = (await request.json()) as { id?: unknown; calls?: unknown; apiKey?: unknown; state?: unknown };
  const typedKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
  setLastTypedKey(typedKey);
  const calls = body.calls;
  const isCallsValid = isCallsInRange(calls);
  if (!isCallsValid)
    return new Response(`calls must be an integer from ${MIN_CALLS} to ${MAX_CALLS}`, { status: 400 });
  const isStateObject = isPlainObject(body.state);
  if (!isStateObject)
    return new Response('state must be a JSON object', { status: 400 });
  const state = body.state as Record<string, JsonValue>;
  const history = await loadHistory(historyPath);
  const shownVersion = findVersionById(history, body.id);
  if (shownVersion === undefined)
    return new Response('id must be the id of an existing version', { status: 400 });
  const envKey = (Bun.env.TYPESAFE_API_KEY ?? '').trim();
  const apiKey = selectApiKey(typedKey, envKey);
  if (apiKey === '')
    return new Response(MISSING_KEY_MESSAGE, { status: 400 });
  const outputs = await collectOutputs(createClient(apiKey), calls, state);
  const version = addRunToHistory(history, shownVersion, outputs, state);
  await writeHistory(historyPath, history);
  return Response.json({ outputs, version });
}
