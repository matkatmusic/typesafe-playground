import type { InfoPart, InfoRow } from './infoTypes';
import { appendReferenceText } from './backtickTooltip';
import { getShownVersion } from './state';

// export function addPart(parent: HTMLElement, text: string, className: string): void {
export function addPart(parent: HTMLElement, text: string, className: string, question: unknown): void {
  const span = document.createElement('span');
  span.className = className;
  const isMessage = className.includes('info-message');
  if (isMessage) {
    const version = getShownVersion();
    // appendReferenceText(span, text, version.state, version.questions);
    appendReferenceText(span, text, version.state, question);
    parent.appendChild(span);
    return;
  }
  span.textContent = text;
  parent.appendChild(span);
}

// export function addParts(parent: HTMLElement, parts: InfoPart[]): void {
export function addParts(parent: HTMLElement, parts: InfoPart[], question: unknown): void {
  for (const part of parts)
    // addPart(parent, part[0], part[1]);
    addPart(parent, part[0], part[1], question);
}

// export function addInfoRow(box: HTMLElement, row: InfoRow): void {
export function addInfoRow(box: HTMLElement, row: InfoRow, question: unknown): void {
  // addPart(box, row.label, 'info-label');
  addPart(box, row.label, 'info-label', question);
  const valueCell = document.createElement('span');
  valueCell.className = 'info-cell';
  // addParts(valueCell, row.parts);
  addParts(valueCell, row.parts, question);
  box.appendChild(valueCell);
}

// export function createBarInfoBox(rows: InfoRow[]): HTMLDivElement {
export function createBarInfoBox(rows: InfoRow[], question: unknown): HTMLDivElement {
  const box = document.createElement('div');
  box.className = 'bar-info';
  for (const row of rows)
    // addInfoRow(box, row);
    addInfoRow(box, row, question);
  return box;
}
