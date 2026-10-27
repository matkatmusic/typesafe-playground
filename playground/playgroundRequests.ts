import { TypeSafeClient, type Questions, type EntryType } from '@typesafe-ai/sdk';
import { loadHistory, writeHistory, type RunOutput } from './playgroundHistory';
import { setLastTypedKey } from './serverErrors';
import { HARD_CODED_QUESTIONS, HARD_CODED_STATE } from './typeSafeQuery';

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

export async function collectOutputs(client: RunClient, calls: number): Promise<RunOutput[]> {
  const outputs: RunOutput[] = [];
  for (let i = 0; i < calls; i++)
    outputs.push(await client.systemOne({ state: HARD_CODED_STATE, questions: HARD_CODED_QUESTIONS }));
  return outputs;
}

export async function executeRunRequest(request: Request, createClient: CreateRunClient, historyPath: string): Promise<Response> {
  const body = (await request.json()) as { calls?: unknown; apiKey?: unknown };
  const typedKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
  setLastTypedKey(typedKey);
  const calls = body.calls;
  const isCallsValid = isCallsInRange(calls);
  if (!isCallsValid)
    return new Response(`calls must be an integer from ${MIN_CALLS} to ${MAX_CALLS}`, { status: 400 });
  const envKey = (Bun.env.TYPESAFE_API_KEY ?? '').trim();
  const apiKey = selectApiKey(typedKey, envKey);
  if (apiKey === '')
    return new Response(MISSING_KEY_MESSAGE, { status: 400 });
  const history = await loadHistory(historyPath);
  const version = history[history.length - 1];
  const outputs = await collectOutputs(createClient(apiKey), calls);
  version.outputs.push(...outputs);
  version.calls += outputs.length;
  await writeHistory(historyPath, history);
  return Response.json({ outputs, version });
}
