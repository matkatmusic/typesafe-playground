import { getButton, getElement, getInput } from './dom';
import { readPageData } from './pageData';
import { pageState } from './state';
import type { Provider } from '../playgroundHistory';

export const ENV_KEY_PLACEHOLDER = 'Using key from .env';
export const TYPED_KEY_PLACEHOLDER = 'TypeSafe API key';
export const SUBMIT_KEY_MESSAGE = 'Add a TypeSafe API key to submit runs';
const SHOW_KEY_MS = 10 * 1000;
let hideTimerId: number | undefined;

export function computeKeyPlaceholder(hasEnvKey: boolean, provider: Provider): string {
  if (hasEnvKey)
    return ENV_KEY_PLACEHOLDER;
  return `${provider} API key`;
}

export function computeSubmitKeyMessage(provider: Provider): string {
  return `Add a ${provider} API key to submit runs`;
}

export function setKeyPlaceholder(hasEnvKey: boolean, provider: Provider): void {
  getInput('typeSafeKeyEditor').placeholder = computeKeyPlaceholder(hasEnvKey, provider);
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

export function isKeyMissing(hasEnvKey: boolean, typedKey: string): boolean {
  if (hasEnvKey)
    return false;
  return typedKey.trim() === '';
}

export function readTypedKey(): string {
  return getInput('typeSafeKeyEditor').value.trim();
}

export function readProvider(): Provider {
  if (getInput('providerSwitch').checked)
    return 'SubQ';
  return 'TypeSafe';
}

export function refreshProviderSwitch(): void {
  getInput('providerSwitch').disabled = !readPageData().hasSubqEnvKey;
}

function readHasEnvKeyForProvider(): boolean {
  const pageData = readPageData();
  if (readProvider() === 'SubQ')
    return pageData.hasSubqEnvKey;
  return pageData.hasEnvKey;
}

export function clearTypedKey(): void {
  getInput('typeSafeKeyEditor').value = '';
  updateShowKeyButton();
}

export function refreshKeyTexts(): void {
  const provider = readProvider();
  getElement('typeSafeKeyLabel').textContent = `${provider} API key`;
  setKeyPlaceholder(readHasEnvKeyForProvider(), provider);
}

export function refreshSubmitAvailability(): void {
  // const isMissing = isKeyMissing(readPageData().hasEnvKey, readTypedKey());
  const isMissing = isKeyMissing(readHasEnvKeyForProvider(), readTypedKey());
  // getButton('submitButton').disabled = isMissing;
  getButton('submitButton').disabled = isMissing || pageState.batchRun !== null;
  // getElement('errorLine').textContent = isMissing ? SUBMIT_KEY_MESSAGE : '';
  getElement('errorLine').textContent = isMissing ? computeSubmitKeyMessage(readProvider()) : '';
}

export function setTypedKeyToVisible(): void {
  getInput('typeSafeKeyEditor').type = 'text';
  clearTimeout(hideTimerId);
  hideTimerId = window.setTimeout(hideTypedKey, SHOW_KEY_MS);
}
