import type { EntryType, Questions } from '@typesafe-ai/sdk';
import type { RunOutput } from '../history/playgroundHistory';
import type { RunClient } from '../server/playgroundRequests';

export const SUBQ_SYSTEM_ONE_URL = 'https://api.subq.ai/v1/systemone';
export const SUBQ_MODEL = 'subq-snap-1.2';

type SubqErrorBody = { detail: { error_type: string; message: string } };

export function createSubqClient(apiKey: string): RunClient {
  async function systemOne(request: { state: EntryType; questions: Questions }): Promise<RunOutput> {
    const response = await fetch(SUBQ_SYSTEM_ONE_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: SUBQ_MODEL, state: request.state, questions: request.questions }),
    });
    if (!response.ok) {
      const errorBody = (await response.json()) as SubqErrorBody;
      throw new Error(`SubQ ${response.status} ${errorBody.detail.error_type}: ${errorBody.detail.message}`);
    }
    return (await response.json()) as RunOutput;
  }
  return { systemOne };
}
