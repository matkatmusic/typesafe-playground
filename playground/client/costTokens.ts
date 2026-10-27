import type { Version } from '../playgroundHistory';
import { getElement } from './dom';

export const INPUT_COST_PER_MILLION = 0.042;

export function computeInputTokens(version: Version): number {
  let inputTokens = 0;
  for (const output of version.outputs)
    inputTokens += output.usage.input_tokens;
  return inputTokens;
}

export function formatCostText(inputTokens: number): string {
  return 'Cost: $' + (inputTokens * INPUT_COST_PER_MILLION / 1000000).toFixed(6);
}

export function formatTokensText(inputTokens: number): string {
  return `Tokens: ${inputTokens}`;
}

export function renderCostAndTokens(version: Version): void {
  const inputTokens = computeInputTokens(version);
  getElement('costLabel').textContent = formatCostText(inputTokens);
  getElement('tokensLabel').textContent = formatTokensText(inputTokens);
}
