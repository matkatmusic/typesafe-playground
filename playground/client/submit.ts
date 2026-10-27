import { readTypedKey, refreshSubmitAvailability } from './apiKey';
import { getButton, getElement, getInput } from './dom';
import { getStateEditor } from './editors';
import { computeJsonParseResult } from './jsonParse';
import { markPageChanged } from './pageChanged';
import { getShownVersion, pageState } from './state';
import type { RunBody, RunResult } from './types';
import { renderShownVersion } from './versionBox';

export const SUBMIT_TEXT = 'Submit (paid)';
export const RUNNING_TEXT = 'running…';

export function buildRunBody(state: unknown): RunBody {
  return { id: getShownVersion().id, calls: Number(getInput('callsPicker').value), apiKey: readTypedKey(), state: state };
}

export function sendRun(runBody: RunBody): Promise<Response> {
  return fetch('/run', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(runBody) });
}

export function formatRunFailure(status: number, text: string): string {
  return `Run failed: ${status} ${text}`;
}

export async function executeSubmit(): Promise<void> {
  const submitButton = getButton('submitButton');
  const errorLine = getElement('errorLine');
  errorLine.textContent = '';
  const stateResult = computeJsonParseResult('state', getStateEditor().state.doc.toString());
  if (!stateResult.isValid) {
    errorLine.textContent = stateResult.errorMessage;
    return;
  }
  submitButton.disabled = true;
  submitButton.textContent = RUNNING_TEXT;
  const response = await sendRun(buildRunBody(stateResult.value));
  submitButton.textContent = SUBMIT_TEXT;
  refreshSubmitAvailability();
  if (!response.ok) {
    errorLine.textContent = formatRunFailure(response.status, await response.text());
    return;
  }
  const result: RunResult = await response.json();
  pageState.versions[result.version.id - 1] = result.version;
  pageState.index = result.version.id - 1;
  markPageChanged('last run');
  renderShownVersion();
}
