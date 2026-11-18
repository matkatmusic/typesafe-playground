import { hoverTooltip } from '@codemirror/view';
import type { EditorView, Tooltip } from '@codemirror/view';
import type { EditorState, Extension } from '@codemirror/state';
import { findReferenceValue } from '../../typesafe-checks/typesafeChecks';
import { listBothEditorStates } from './backtickEditors';
import { findEnclosingQuestion } from './backtickLint';
import { computeJsonParseResult } from '../editors/jsonParse';
import { getReferencePattern, formatReferenceValue } from './references';
import { pageState } from '../page/state';

function buildBacktickedNamePattern(): RegExp {
    return /(?<!\\)`([^`\s]+)`/g;
}

function getBatchHoverText(): string {
    return 'hover text replacement not active in batch mode';
}

class OpenTooltipHolder {
    private static instance: OpenTooltipHolder | undefined;
    public openTooltip: HTMLElement | null = null;
    private constructor() {}
    public static getInstance() {
        OpenTooltipHolder.instance ??= new OpenTooltipHolder();
        return OpenTooltipHolder.instance;
    }
}

export function findReferenceTooltipText(name: string, state: unknown, question: unknown): string | null {
    const referenceLookup = findReferenceValue(state, question, name);
    if (!referenceLookup.isFound)
        return null;
    return formatReferenceValue(referenceLookup.value);
}

export function createReferenceTooltipElement(text: string): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'backtick-tooltip';
    dom.textContent = text;
    return dom;
}

interface BacktickMatch {
    name: string;
    from: number;
    to: number;
}

function findBacktickMatchAtPosition(view: EditorView, pos: number): BacktickMatch | null {
    const line = view.state.doc.lineAt(pos);
    for (const match of line.text.matchAll(buildBacktickedNamePattern())) {
        const name = match[1];
        const from = line.from + match.index + 1;
        const to = from + name.length;
        const isOverName = pos >= from && pos <= to;
        if (isOverName)
            return { name, from, to };
    }
    return null;
}

function createHoverTooltip(from: number, to: number, text: string): Tooltip {
    return { pos: from, end: to, above: true, create: () => ({ dom: createReferenceTooltipElement(text) }) };
}

function findHoverReferenceText(listStates: () => EditorState[], view: EditorView, name: string, from: number): string | null {
    const states = listStates();
    const stateParse = computeJsonParseResult('State', states[0].doc.toString());
    const questionsParse = computeJsonParseResult('Questions', states[1].doc.toString());
    const isStateInvalid = !stateParse.isValid;
    const isQuestionsInvalid = !questionsParse.isValid;
    const isEitherInvalid = isStateInvalid || isQuestionsInvalid;
    if (isEitherInvalid)
        return null;
    const question = findEnclosingQuestion(view.state, questionsParse.value, from);
    return findReferenceTooltipText(name, stateParse.value, question);
}

function findBacktickValueTooltipInStates(listStates: () => EditorState[], view: EditorView, pos: number): Tooltip | null {
    const backtickMatch = findBacktickMatchAtPosition(view, pos);
    if (backtickMatch === null)
        return null;
    const { name, from, to } = backtickMatch;
    if (pageState.isBatchOn)
        return createHoverTooltip(from, to, getBatchHoverText());
    const text = findHoverReferenceText(listStates, view, name, from);
    if (text === null)
        return null;
    return createHoverTooltip(from, to, text);
}

export function buildBacktickHoverSource(listStates: () => EditorState[]): (view: EditorView, pos: number) => Tooltip | null {
    function findBacktickValueTooltip(view: EditorView, pos: number): Tooltip | null {
        return findBacktickValueTooltipInStates(listStates, view, pos);
    }
    return findBacktickValueTooltip;
}

export function createBacktickHover(): Extension {
    return hoverTooltip(buildBacktickHoverSource(listBothEditorStates));
}

export function removeReferenceTooltip(): void {
    const holder = OpenTooltipHolder.getInstance();
    if (holder.openTooltip === null)
        return;
    holder.openTooltip.remove();
    holder.openTooltip = null;
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
        OpenTooltipHolder.getInstance().openTooltip = tooltip;
    }
    return addReferenceTooltip;
}

function createReferenceSpan(matchedText: string, tooltipText: string): HTMLElement {
    const span = document.createElement('span');
    span.className = 'backtick-ref';
    span.textContent = matchedText;
    span.addEventListener('mouseenter', buildTooltipOpener(span, tooltipText));
    span.addEventListener('mouseleave', removeReferenceTooltip);
    return span;
}

export function appendReferenceText(parent: HTMLElement, text: string, state: unknown, question: unknown): void {
    let plainStart = 0;
    for (const match of text.matchAll(getReferencePattern())) {
        const tooltipText = findReferenceTooltipText(match[1], state, question);
        if (tooltipText === null)
            continue;
        parent.appendChild(document.createTextNode(text.slice(plainStart, match.index)));
        parent.appendChild(createReferenceSpan(match[0], tooltipText));
        plainStart = match.index + match[0].length;
    }
    parent.appendChild(document.createTextNode(text.slice(plainStart)));
}
