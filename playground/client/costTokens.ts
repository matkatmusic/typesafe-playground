import type { Version } from '../playgroundHistory';
import { getElement } from './dom';
import { pageState } from './state';

export const INPUT_COST_PER_MILLION = 0.042;

export function computeInputTokens(version: Version): number {
  let inputTokens = 0;
  for (const output of version.outputs)
    inputTokens += output.usage.input_tokens;
  return inputTokens;
}

export const SUBQ_INPUT_COST_PER_MILLION = 0.04;

export function computeInputCost(version: Version): number {
  let inputCost = 0;
  for (const output of version.outputs) {
    const rate = output.provider === 'SubQ' ? SUBQ_INPUT_COST_PER_MILLION : INPUT_COST_PER_MILLION;
    inputCost += output.usage.input_tokens * rate / 1000000;
  }
  return inputCost;
}

export function computeTotalInputCost(versions: Version[]): number {
  let totalInputCost = 0;
  for (const version of versions)
    totalInputCost += computeInputCost(version);
  return totalInputCost;
}

export function formatCostText(inputCost: number): string {
  return 'Cost: $' + inputCost.toFixed(6);
}

export function formatTokensText(inputTokens: number): string {
  return `Tokens: ${inputTokens}`;
}

export function computeTotalInputTokens(versions: Version[]): number {
  let totalInputTokens = 0;
  for (const version of versions)
    totalInputTokens += computeInputTokens(version);
  return totalInputTokens;
}

export function formatTotalCostText(inputCost: number): string {
  return 'total cost: $' + inputCost.toFixed(6);
}

export function renderTotalCost(): void {
  getElement('totalCostLabel').textContent = formatTotalCostText(computeTotalInputCost(pageState.versions));
}

export function renderCostAndTokens(version: Version): void {
  renderTotalCost();
  const inputTokens = computeInputTokens(version);
  getElement('costLabel').textContent = formatCostText(computeInputCost(version));
  getElement('tokensLabel').textContent = formatTokensText(inputTokens);
}
