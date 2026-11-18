import type { Question } from '@typesafe-ai/sdk';
import type { Answer, ChartLayout, GraphBlock, PinnedData } from './graphTypes';
import { computeBaseline, computePlotHeight, computeSlotLeft, computeSlotWidth, computeY, getBottomMargin, getLeftMargin, getNoulBaseline, getTickCount, getTopMargin } from './graphGeometry';
import { renderOption } from './graphOption';
import type { Provider } from '../../history/playgroundHistory';
import { graphState } from './graphState';
import { computeSummary, listOptionKeys, listValues } from './graphValues';
import { readPinnedValues } from '../pins/pinned';
import { createSvgNode } from './svgDom';

function renderAxis(svg: Element, plotRight: number, plotH: number): void {
    for (let tick = 0; tick <= getTickCount(); tick++) {
        const value = tick / getTickCount();
        svg.appendChild(createSvgNode('line', { x1: getLeftMargin(), x2: plotRight, y1: computeY(value, plotH), y2: computeY(value, plotH), stroke: 'var(--grid)' }));
        svg.appendChild(createSvgNode('text', { x: getLeftMargin() - 6, y: computeY(value, plotH) + 4, 'text-anchor': 'end' }, value.toFixed(1)));
    }
}

export function renderNoulAxis(svg: Element, plotRight: number, plotH: number): void {
    const midY = computeY(getNoulBaseline(), plotH);
    svg.appendChild(createSvgNode('line', { x1: getLeftMargin(), x2: getLeftMargin(), y1: computeY(1, plotH), y2: computeY(0, plotH), stroke: 'var(--text-muted)' }));
    svg.appendChild(createSvgNode('line', { x1: getLeftMargin(), x2: plotRight, y1: midY, y2: midY, stroke: 'var(--text-muted)' }));
    svg.appendChild(createSvgNode('text', { x: getLeftMargin(), y: computeY(1, plotH) - 6, 'text-anchor': 'middle' }, 'True'));
    svg.appendChild(createSvgNode('text', { x: getLeftMargin(), y: computeY(0, plotH) + 12, 'text-anchor': 'middle' }, 'False'));
}

export function listSortedKeys(answers: Answer[]): string[] {
    const keys = listOptionKeys(answers[0]);
    const averages: Record<string, number> = {};
    for (const key of keys)
        averages[key] = computeSummary(listValues(answers, key)).average;
    function compareByAverage(a: string, b: string): number {
        return averages[b] - averages[a];
    }
    keys.sort(compareByAverage);
    return keys;
}

function renderAxisForQuestion(svg: Element, question: Question, plotRight: number, plotH: number): void {
    if (question.type === 'noul')
        renderNoulAxis(svg, plotRight, plotH);
    else
        renderAxis(svg, plotRight, plotH);
}

function renderAllOptions(svg: Element, keys: string[], answers: Answer[], providers: Provider[], pinned: PinnedData | null, slot: number, plotH: number, isAverageShown: boolean, baseline: number): void {
    for (let i = 0; i < keys.length; i++) {
        const pinnedValues = readPinnedValues(pinned, keys[i]);
        if (pinned !== null) {
            if (pinnedValues !== null)
                renderOption(svg, pinnedValues.values, computeSlotLeft(i, slot), plotH, isAverageShown, baseline, true, pinned.providers);
        }
        renderOption(svg, listValues(answers, keys[i]), computeSlotLeft(i, slot), plotH, isAverageShown, baseline, false, providers);
    }
}

export function renderChart(graphBlock: GraphBlock, name: string, question: Question, answers: Answer[], pinned: PinnedData | null, providers: Provider[]): ChartLayout {
    const { block, box } = graphBlock;
    const keys = listSortedKeys(answers);
    const isAverageShown = graphState.averageShownByName[name] === true;
    const plotH = computePlotHeight(box.clientHeight);
    const slot = computeSlotWidth(Math.max(answers.length, pinned === null ? 0 : pinned.answers.length), isAverageShown);
    const plotRight = getLeftMargin() + keys.length * slot;
    const svg = createSvgNode('svg', { width: plotRight + 20, height: getTopMargin() + plotH + getBottomMargin(), role: 'img' });
    const baseline = computeBaseline(question);
    renderAxisForQuestion(svg, question, plotRight, plotH);
    renderAllOptions(svg, keys, answers, providers, pinned, slot, plotH, isAverageShown, baseline);
    box.replaceChildren(svg);
    return { name, block, box, svg, question, answers, providers, keys, slot, plotH, isAverageShown, baseline, pinned };
}
