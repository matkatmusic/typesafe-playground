import type { ChartLayout } from './graphTypes';
import type { BarInfoRequest, ColumnHit, HoverTracker } from './infoTypes';
import { computeBarOffset, computeSlotLeft } from './graphGeometry';
import { listValues } from './graphValues';
import { createBarInfoBox } from './infoDom';
import { computeHitBar } from './infoGeometry';
import { attachHover, updateShownInfo } from './infoHover';
import { buildBarInfoRows } from './infoRows';
import { readWinningKey } from './infoWinner';
import { createSvgNode } from './svgDom';

export function attachColumnHits(chart: ChartLayout, tracker: HoverTracker, columnIndex: number): ColumnHit {
  const { svg, question, answers, keys, plotH, isAverageShown, baseline } = chart;
  const key = keys[columnIndex];
  const slotX = computeSlotLeft(columnIndex, chart.slot);
  const values = listValues(answers, key);
  const offset = computeBarOffset(isAverageShown);
  let firstHit: ColumnHit | null = null;
  for (let callIndex = isAverageShown ? -1 : 0; callIndex < values.length; callIndex++) {
    const bar = computeHitBar(slotX, offset, callIndex, values, plotH, baseline);
    const hit = createSvgNode('rect', { x: bar.x, y: bar.y, width: bar.width, height: bar.height, fill: 'transparent', 'stroke-width': 1 });
    const request: BarInfoRequest = { question, answers, key, keys, callIndex };
    attachHover({ tracker, svg, hit, request, values, slotX, plotH, isAverageShown, baseline });
    svg.appendChild(hit);
    if (firstHit === null)
      firstHit = { hit, request };
  }
  if (firstHit === null)
    throw new Error('a chart column has no bars');
  return firstHit;
}

export function attachChartInfoBox(chart: ChartLayout): void {
  const tracker: HoverTracker = { block: chart.block, shownHit: null };
  const { answers, keys } = chart;
  // const blankRows = buildBarInfoRows({ question, answers, key: '', keys, callIndex: null });
  // updateShownInfo(tracker, createBarInfoBox(blankRows), null);
  const winningKey = readWinningKey(answers, keys);
  let winningHit: ColumnHit | null = null;
  for (let columnIndex = 0; columnIndex < keys.length; columnIndex++) {
    const columnHit = attachColumnHits(chart, tracker, columnIndex);
    const isWinningColumn = keys[columnIndex] === winningKey;
    if (isWinningColumn)
      winningHit = columnHit;
  }
  if (winningHit === null)
    throw new Error('the winning key has no column');
  updateShownInfo(tracker, createBarInfoBox(buildBarInfoRows(winningHit.request)), winningHit.hit);
}

export function attachInfoBox(charts: ChartLayout[]): void {
  for (const chart of charts)
    attachChartInfoBox(chart);
}
