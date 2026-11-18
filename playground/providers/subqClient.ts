import type { EntryType, Questions } from '@typesafe-ai/sdk';
import type { RunOutput } from '../history/playgroundHistory';
import type { RunClient } from '../server/playgroundRequests';

interface SubqErrorBody { detail: { error_type: string; message: string } }

async function fetchSystemOne(apiKey: string, request: { state: EntryType; questions: Questions }): Promise<RunOutput> {
    const subqSystemOneUrl = 'https://api.subq.ai/v1/systemone';
    const subqModel = 'subq-snap-1.2';
    const response = await fetch(subqSystemOneUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: subqModel, state: request.state, questions: request.questions }),
    });
    if (!response.ok) {
        const errorBody = (await response.json()) as SubqErrorBody;
        throw new Error(`SubQ ${response.status} ${errorBody.detail.error_type}: ${errorBody.detail.message}`);
    }
    return (await response.json()) as RunOutput;
}

export function createSubqClient(apiKey: string): RunClient {
    return { systemOne: (request) => fetchSystemOne(apiKey, request) };
}
