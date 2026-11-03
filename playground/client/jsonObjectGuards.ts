import type { JsonValue, Questions } from '@typesafe-ai/sdk';
import { isPlainObject } from '../isPlainObject';

export function isJsonObject(value: unknown): value is Record<string, JsonValue> {
  return isPlainObject(value);
}

export function isQuestionsObject(value: unknown): value is Questions {
  return isPlainObject(value);
}
