export type JsonParseResult =
  | { isValid: true; value: unknown }
  | { isValid: false; errorMessage: string };

export function computeJsonParseResult(label: string, text: string): JsonParseResult {
  try {
    return { isValid: true, value: JSON.parse(text) };
  }
  catch (failure) {
    return { isValid: false, errorMessage: `${label} is not valid JSON: ${(failure as Error).message}` };
  }
}
