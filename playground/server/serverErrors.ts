class ServerErrorState {
    public static readonly hiddenKeyText = '[key hidden]';
    public static lastTypedKey = '';
    private static instance: ServerErrorState | undefined;

    private constructor() {}

    public static getInstance(): ServerErrorState {
        if (ServerErrorState.instance === undefined) {
            ServerErrorState.instance = new ServerErrorState();
        }
        return ServerErrorState.instance;
    }
}

export function setLastTypedKey(typedKey: string): void {
    ServerErrorState.lastTypedKey = typedKey;
}

export function hideKeysInMessage(message: string): string {
    const envKey = (Bun.env.TYPESAFE_API_KEY ?? '').trim();
    const subqEnvKey = (Bun.env.SUBQ_AI_API_KEY ?? '').trim();
    const knownKeys = [envKey, subqEnvKey, ServerErrorState.lastTypedKey];
    let hiddenMessage = message;
    for (const knownKey of knownKeys) {
        if (knownKey !== '')
            hiddenMessage = hiddenMessage.replaceAll(knownKey, ServerErrorState.hiddenKeyText);
    }
    return hiddenMessage;
}

export function buildErrorResponse(error: Error): Response {
    return new Response(hideKeysInMessage(error.message), { status: 500 });
}
