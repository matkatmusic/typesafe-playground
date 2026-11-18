import { getButton, getElement, getInput } from '../page/dom';
import { readPageData } from '../page/pageData';
import { pageState } from '../page/state';
import type { Provider } from '../../history/playgroundHistory';

class HideTimerHolder {
    private static instance: HideTimerHolder | undefined;
    public hideTimerId: number | undefined = undefined;
    private constructor() {}
    public static getInstance(): HideTimerHolder {
        HideTimerHolder.instance ??= new HideTimerHolder();
        return HideTimerHolder.instance;
    }
}

export function computeKeyPlaceholder(hasEnvKey: boolean, provider: Provider): string {
    if (hasEnvKey)
        return 'Using key from .env';
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
    const isSubqChecked = getInput('providerSwitch').checked;
    if (isSubqChecked)
        return 'SubQ';
    return 'TypeSafe';
}

export function refreshProviderSwitch(): void {
    getInput('providerSwitch').disabled = !readPageData().hasSubqEnvKey;
}

function readHasEnvKeyForProvider(): boolean {
    const pageData = readPageData();
    const provider = readProvider();
    if (provider === 'SubQ')
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
    const isMissing = isKeyMissing(readHasEnvKeyForProvider(), readTypedKey());
    getButton('submitButton').disabled = isMissing || pageState.batchRun !== null;
    getElement('errorLine').textContent = isMissing ? computeSubmitKeyMessage(readProvider()) : '';
}

export function setTypedKeyToVisible(): void {
    getInput('typeSafeKeyEditor').type = 'text';
    const timerHolder = HideTimerHolder.getInstance();
    clearTimeout(timerHolder.hideTimerId);
    timerHolder.hideTimerId = window.setTimeout(hideTypedKey, 10 * 1000);
}
