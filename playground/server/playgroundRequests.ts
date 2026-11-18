import { type Questions, type JsonValue } from '@typesafe-ai/sdk';
import { findVersionByIndex, loadHistory, writeHistory, type Provider, type RunOutput, type Version } from '../history/playgroundHistory';
import { getNotRunTime } from '../history/notRunTime';
import { isPlainObject } from './playgroundVersionRequests';
import { computeVersionStep } from '../history/playgroundVersionStep';
import { setLastTypedKey } from './serverErrors';
import { getMissingKeyMessage, getSubqMissingKeyMessage, getMinCalls, getMaxCalls, isCallsInRange, selectApiKey, type RunClient, type CreateRunClient } from './playgroundRequestsClient';

export * from './playgroundRequestsClient';

function isProvider(value: unknown): value is Provider {
    return value === 'TypeSafe' || value === 'SubQ';
}

function selectApiKeyForProvider(provider: Provider, typedKey: string): string {
    if (provider === 'SubQ')
        return selectApiKey(typedKey, (Bun.env.SUBQ_AI_API_KEY ?? '').trim());
    return selectApiKey(typedKey, (Bun.env.TYPESAFE_API_KEY ?? '').trim());
}

export async function collectOutputs(client: RunClient, calls: number, state: Record<string, JsonValue>, questions: Questions, provider: Provider): Promise<RunOutput[]> {
    const outputs: RunOutput[] = [];
    for (let i = 0; i < calls; i++) {
        const output = await client.systemOne({ state: state, questions: questions });
        outputs.push({ ...output, provider: provider });
    }
    return outputs;
}



function appendOutputsToVersion(version: Version, outputs: RunOutput[]): Version {
    const notRunTime = getNotRunTime();
    if (version.time === notRunTime)
        version.time = new Date().toISOString();
    version.outputs.push(...outputs);
    version.calls += outputs.length;
    return version;
}

export function addRunToHistory(history: Version[], shownVersion: Version, outputs: RunOutput[], state: Record<string, JsonValue>, questions: Questions): Version {
    const step = computeVersionStep(shownVersion, state, questions);
    if (step === 'overwrite') {
        shownVersion.state = state;
        shownVersion.questions = questions;
    }
    const isRecordingOnShown = step !== 'create';
    if (isRecordingOnShown)
        return appendOutputsToVersion(shownVersion, outputs);
    const version: Version = { time: new Date().toISOString(), state: state, questions: questions, calls: outputs.length, outputs };
    history.push(version);
    return version;
}

export async function executeRunRequest(request: Request, createClient: CreateRunClient, historyPath: string): Promise<Response> {
    const body = (await request.json()) as { index?: unknown; calls?: unknown; apiKey?: unknown; state?: unknown; questions?: unknown };
    const typedKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
    setLastTypedKey(typedKey);
    const invalidBodyResponse = validateRunBodyShape(body);
    if (invalidBodyResponse !== undefined)
        return invalidBodyResponse;
    const history = await loadHistory(historyPath);
    const shownVersion = findVersionByIndex(history, body.index);
    if (shownVersion === undefined)
        return new Response('index must be the integer index of an existing version', { status: 400 });
    return executeCallsAndWriteHistory(body, typedKey, createClient, historyPath, history, shownVersion);
}

interface RunRequestBody { index?: unknown; calls?: unknown; apiKey?: unknown; state?: unknown; questions?: unknown; provider?: unknown }

function validateProviderField(provider: unknown): Response | undefined {
    if (provider === undefined)
        return undefined;
    const isProviderValid = isProvider(provider);
    if (!isProviderValid)
        return new Response("provider must be 'TypeSafe' or 'SubQ'", { status: 400 });
    return undefined;
}

function validateRunBodyShape(body: RunRequestBody): Response | undefined {
    const invalidProviderResponse = validateProviderField(body.provider);
    if (invalidProviderResponse !== undefined)
        return invalidProviderResponse;
    const isCallsValid = isCallsInRange(body.calls);
    if (!isCallsValid)
        return new Response(`calls must be an integer from ${getMinCalls()} to ${getMaxCalls()}`, { status: 400 });
    const isStateObject = isPlainObject(body.state);
    if (!isStateObject)
        return new Response('state must be a JSON object', { status: 400 });
    const isQuestionsObject = isPlainObject(body.questions);
    if (!isQuestionsObject)
        return new Response('questions must be a JSON object', { status: 400 });
    return undefined;
}

async function executeCallsAndWriteHistory(body: RunRequestBody, typedKey: string, createClient: CreateRunClient, historyPath: string, history: Version[], shownVersion: Version): Promise<Response> {
    const provider: Provider = body.provider === undefined ? 'TypeSafe' : (body.provider as Provider);
    const apiKey = selectApiKeyForProvider(provider, typedKey);
    if (apiKey === '')
        return new Response(provider === 'SubQ' ? getSubqMissingKeyMessage() : getMissingKeyMessage(), { status: 400 });
    const state = body.state as Record<string, JsonValue>;
    const questions = body.questions as Questions;
    const outputs = await collectOutputs(createClient(apiKey, provider), body.calls as number, state, questions, provider);
    const version = addRunToHistory(history, shownVersion, outputs, state, questions);
    await writeHistory(historyPath, history);
    const index = history.indexOf(version);
    return Response.json({ outputs, version, index });
}
