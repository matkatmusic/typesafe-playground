import { TypeSafeClient, type Questions, type EntryType } from '@typesafe-ai/sdk';
import { setLastTypedKey } from './serverErrors';
import { HARD_CODED_QUESTIONS, HARD_CODED_STATE } from './typeSafeQuery';

export const MISSING_KEY_MESSAGE = 'Add a TypeSafe API key';

export type RunClient = {
  systemOne(request: { state: EntryType; questions: Questions }): Promise<unknown>;
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

export async function executeRunRequest(request: Request, createClient: CreateRunClient): Promise<Response> {
  const body = (await request.json()) as { apiKey?: unknown };
  const typedKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
  setLastTypedKey(typedKey);
  const envKey = (Bun.env.TYPESAFE_API_KEY ?? '').trim();
  const apiKey = selectApiKey(typedKey, envKey);
  if (apiKey === '')
    return new Response(MISSING_KEY_MESSAGE, { status: 400 });
  const client = createClient(apiKey);
  const output = await client.systemOne({ state: HARD_CODED_STATE, questions: HARD_CODED_QUESTIONS });
  return Response.json(output);
}
