import { readTypedKey, refreshSubmitAvailability } from './apiKey';
import { renderCostAndTokens } from './costTokens';
import { getButton, getElement, getInput } from './dom';
import { renderResultJson } from './editors';
import type { RunBody, RunResult } from './types';

export const SUBMIT_TEXT = 'Submit (paid)';
export const RUNNING_TEXT = 'running…';

export function buildRunBody(): RunBody {
  return { calls: Number(getInput('callsPicker').value), apiKey: readTypedKey() };
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
  submitButton.disabled = true;
  submitButton.textContent = RUNNING_TEXT;
  const response = await sendRun(buildRunBody());
  submitButton.textContent = SUBMIT_TEXT;
  refreshSubmitAvailability();
  if (!response.ok) {
    errorLine.textContent = formatRunFailure(response.status, await response.text());
    return;
  }
  const result: RunResult = await response.json();
  renderCostAndTokens(result.version);
  renderResultJson(result.outputs);
}
