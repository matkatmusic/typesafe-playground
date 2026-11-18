import { TypeSafeClient, type Questions, type EntryType } from '@typesafe-ai/sdk';
import { type Provider, type RunOutput } from '../history/playgroundHistory';
import { createSubqClient } from '../providers/subqClient';

export function getMissingKeyMessage(): string {
    return 'Add a TypeSafe API key';
}

export function getSubqMissingKeyMessage(): string {
    return 'Add a SubQ API key';
}

export function getMinCalls(): number {
    return 1;
}

export function getMaxCalls(): number {
    return 10;
}

export interface RunClient {
    systemOne(request: { state: EntryType; questions: Questions }): Promise<RunOutput>;
}
export type CreateRunClient = (apiKey: string, provider: Provider) => RunClient;

export function createTypeSafeClient(apiKey: string): RunClient {
    return new TypeSafeClient({ apiKey });
}

export function createClientForProvider(apiKey: string, provider: Provider): RunClient {
    if (provider === 'SubQ')
        return createSubqClient(apiKey);
    return createTypeSafeClient(apiKey);
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
    const minCalls = getMinCalls();
    if (calls < minCalls)
        return false;
    return calls <= getMaxCalls();
}
