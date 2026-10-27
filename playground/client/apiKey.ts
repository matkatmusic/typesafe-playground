import { getButton, getInput } from './dom';

export const ENV_KEY_PLACEHOLDER = 'Using key from .env';
export const TYPED_KEY_PLACEHOLDER = 'TypeSafe API key';
const SHOW_KEY_MS = 10 * 1000;
let hideTimerId: number | undefined;

export function computeKeyPlaceholder(hasEnvKey: boolean): string {
  if (hasEnvKey)
    return ENV_KEY_PLACEHOLDER;
  return TYPED_KEY_PLACEHOLDER;
}

export function setKeyPlaceholder(hasEnvKey: boolean): void {
  getInput('typeSafeKeyEditor').placeholder = computeKeyPlaceholder(hasEnvKey);
}

export function hideTypedKey(): void {
  getInput('typeSafeKeyEditor').type = 'password';
}

export function computeShowButtonHidden(keyText: string): boolean {
  return keyText === '';
}

export function updateShowKeyButton(): void {
  const isHidden = computeShowButtonHidden(getInput('typeSafeKeyEditor').value);
  getButton('showKeyButton').hidden = isHidden;
  if (isHidden)
    hideTypedKey();
}

export function setTypedKeyToVisible(): void {
  getInput('typeSafeKeyEditor').type = 'text';
  clearTimeout(hideTimerId);
  hideTimerId = window.setTimeout(hideTypedKey, SHOW_KEY_MS);
}
