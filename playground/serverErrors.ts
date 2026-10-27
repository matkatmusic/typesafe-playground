const HIDDEN_KEY_TEXT = '[key hidden]';
let lastTypedKey = '';

export function setLastTypedKey(typedKey: string): void {
  lastTypedKey = typedKey;
}

export function hideKeysInMessage(message: string): string {
  const envKey = (Bun.env.TYPESAFE_API_KEY ?? '').trim();
  const knownKeys = [envKey, lastTypedKey];
  let hiddenMessage = message;
  for (const knownKey of knownKeys) {
    if (knownKey !== '')
      hiddenMessage = hiddenMessage.replaceAll(knownKey, HIDDEN_KEY_TEXT);
  }
  return hiddenMessage;
}

export function buildErrorResponse(error: Error): Response {
  return new Response(hideKeysInMessage(error.message), { status: 500 });
}
