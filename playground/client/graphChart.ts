import type { Question } from '@typesafe-ai/sdk';
import type { Answer, ChartLayout, GraphBlock } from './graphTypes';
import { BOTTOM, computeBaseline, computePlotHeight, computeSlotLeft, computeSlotWidth, computeY, LEFT, NOUL_BASELINE, TICK_COUNT, TOP } from './graphGeometry';
import { renderOption } from './graphOption';
import { graphState } from './graphState';
import { computeSummary, listOptionKeys, listValues } from './graphValues';
import { createSvgNode } from './svgDom';

function renderAxis(svg: Element, plotRight: number, plotH: number): void {
  for (let tick = 0; tick <= TICK_COUNT; tick++) {
    const value = tick / TICK_COUNT;
    svg.appendChild(createSvgNode('line', { x1: LEFT, x2: plotRight, y1: computeY(value, plotH), y2: computeY(value, plotH), stroke: 'var(--grid)' }));
    svg.appendChild(createSvgNode('text', { x: LEFT - 6, y: computeY(value, plotH) + 4, 'text-anchor': 'end' }, value.toFixed(1)));
  }
}

export function renderNoulAxis(svg: Element, plotRight: number, plotH: number): void {
  const midY = computeY(NOUL_BASELINE, plotH);
  svg.appendChild(createSvgNode('line', { x1: LEFT, x2: LEFT, y1: computeY(1, plotH), y2: computeY(0, plotH), stroke: 'var(--text-muted)' }));
  svg.appendChild(createSvgNode('line', { x1: LEFT, x2: plotRight, y1: midY, y2: midY, stroke: 'var(--text-muted)' }));
  svg.appendChild(createSvgNode('text', { x: LEFT, y: computeY(1, plotH) - 6, 'text-anchor': 'middle' }, 'True'));
  svg.appendChild(createSvgNode('text', { x: LEFT, y: computeY(0, plotH) + 12, 'text-anchor': 'middle' }, 'False'));
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

export function renderChart(graphBlock: GraphBlock, name: string, question: Question, answers: Answer[]): ChartLayout {
  const { block, box } = graphBlock;
  const keys = listSortedKeys(answers);
  const isAverageShown = graphState.averageShownByName[name] === true;
  const plotH = computePlotHeight(box.clientHeight);
  const slot = computeSlotWidth(answers.length, isAverageShown);
  const plotRight = LEFT + keys.length * slot;
  const svg = createSvgNode('svg', { width: plotRight + 20, height: TOP + plotH + BOTTOM, role: 'img' });
  const baseline = computeBaseline(question);
  if (question.type === 'noul')
    renderNoulAxis(svg, plotRight, plotH);
  else
    renderAxis(svg, plotRight, plotH);
  for (let i = 0; i < keys.length; i++)
    renderOption(svg, listValues(answers, keys[i]), computeSlotLeft(i, slot), plotH, isAverageShown, baseline);
  box.replaceChildren(svg);
  return { name, block, box, svg, question, answers, keys, slot, plotH, isAverageShown, baseline };
}
