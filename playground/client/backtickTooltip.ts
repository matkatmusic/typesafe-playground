import { hoverTooltip } from '@codemirror/view';
import type { EditorView, Tooltip } from '@codemirror/view';
import type { EditorState, Extension } from '@codemirror/state';
import { listBothEditorStates } from './backtickCompletion';
import { computeJsonParseResult } from './jsonParse';
import { REFERENCE_PATTERN, findPathValue, formatReferenceValue } from './references';

const BACKTICKED_NAME = /`([^`\s]+)`/g;
let openTooltip: HTMLElement | null = null;

export function findReferenceTooltipText(name: string, state: unknown, questions: unknown): string | null {
  const stateLookup = findPathValue(state, name);
  if (stateLookup.isFound)
    return formatReferenceValue(stateLookup.value);
  const questionsLookup = findPathValue(questions, name);
  if (questionsLookup.isFound)
    return formatReferenceValue(questionsLookup.value);
  return null;
}

export function createReferenceTooltipElement(text: string): HTMLElement {
  const dom = document.createElement('div');
  dom.className = 'backtick-tooltip';
  dom.textContent = text;
  return dom;
}

export function buildBacktickHoverSource(listStates: () => EditorState[]): (view: EditorView, pos: number) => Tooltip | null {
  function findBacktickValueTooltip(view: EditorView, pos: number): Tooltip | null {
    const line = view.state.doc.lineAt(pos);
    for (const match of line.text.matchAll(BACKTICKED_NAME)) {
      const name = match[1];
      const from = line.from + match.index + 1;
      const to = from + name.length;
      const isOverName = pos >= from && pos <= to;
      if (!isOverName)
        continue;
      const states = listStates();
      const stateParse = computeJsonParseResult('State', states[0].doc.toString());
      const questionsParse = computeJsonParseResult('Questions', states[1].doc.toString());
      const isStateInvalid = !stateParse.isValid;
      const isQuestionsInvalid = !questionsParse.isValid;
      const isEitherInvalid = isStateInvalid || isQuestionsInvalid;
      if (isEitherInvalid)
        return null;
      const text = findReferenceTooltipText(name, stateParse.value, questionsParse.value);
      if (text === null)
        return null;
      return { pos: from, end: to, above: true, create: () => ({ dom: createReferenceTooltipElement(text) }) };
    }
    return null;
  }
  return findBacktickValueTooltip;
}

export function createBacktickHover(): Extension {
  return hoverTooltip(buildBacktickHoverSource(listBothEditorStates));
}

export function removeReferenceTooltip(): void {
  if (openTooltip === null)
    return;
  openTooltip.remove();
  openTooltip = null;
}

function buildTooltipOpener(span: HTMLElement, text: string): () => void {
  function addReferenceTooltip(): void {
    removeReferenceTooltip();
    const rect = span.getBoundingClientRect();
    const tooltip = createReferenceTooltipElement(text);
    tooltip.style.position = 'fixed';
    tooltip.style.left = `${rect.left}px`;
    tooltip.style.top = `${rect.bottom}px`;
    document.body.appendChild(tooltip);
    openTooltip = tooltip;
  }
  return addReferenceTooltip;
}

export function appendReferenceText(parent: HTMLElement, text: string, state: unknown, questions: unknown): void {
  let plainStart = 0;
  for (const match of text.matchAll(REFERENCE_PATTERN)) {
    const tooltipText = findReferenceTooltipText(match[1], state, questions);
    if (tooltipText === null)
      continue;
    parent.appendChild(document.createTextNode(text.slice(plainStart, match.index)));
    const span = document.createElement('span');
    span.className = 'backtick-ref';
    span.textContent = match[0];
    span.addEventListener('mouseenter', buildTooltipOpener(span, tooltipText));
    span.addEventListener('mouseleave', removeReferenceTooltip);
    parent.appendChild(span);
    plainStart = match.index + match[0].length;
  }
  parent.appendChild(document.createTextNode(text.slice(plainStart)));
}
