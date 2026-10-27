import type { ChartLayout } from './graphTypes';
import type { BarInfoRequest, HoverTracker } from './infoTypes';
import { computeBarOffset, computeSlotLeft } from './graphGeometry';
import { listValues } from './graphValues';
import { createBarInfoBox } from './infoDom';
import { computeHitBar } from './infoGeometry';
import { attachHover, updateShownInfo } from './infoHover';
import { buildBarInfoRows } from './infoRows';
import { createSvgNode } from './svgDom';

export function attachColumnHits(chart: ChartLayout, tracker: HoverTracker, columnIndex: number): void {
  const { svg, question, answers, keys, plotH, isAverageShown } = chart;
  const key = keys[columnIndex];
  const slotX = computeSlotLeft(columnIndex, chart.slot);
  const values = listValues(answers, key);
  const offset = computeBarOffset(isAverageShown);
  for (let callIndex = isAverageShown ? -1 : 0; callIndex < values.length; callIndex++) {
    const bar = computeHitBar(slotX, offset, callIndex, values, plotH);
    const hit = createSvgNode('rect', { x: bar.x, y: bar.y, width: bar.width, height: bar.height, fill: 'transparent', 'stroke-width': 1 });
    const request: BarInfoRequest = { question, answers, key, keys, callIndex };
    attachHover({ tracker, svg, hit, request, values, slotX, plotH, isAverageShown });
    svg.appendChild(hit);
  }
}

export function attachChartInfoBox(chart: ChartLayout): void {
  const tracker: HoverTracker = { block: chart.block, shownHit: null };
  for (let columnIndex = 0; columnIndex < chart.keys.length; columnIndex++)
    attachColumnHits(chart, tracker, columnIndex);
  const { question, answers, keys } = chart;
  const blankRows = buildBarInfoRows({ question, answers, key: '', keys, callIndex: null });
  updateShownInfo(tracker, createBarInfoBox(blankRows), null);
}

export function attachInfoBox(charts: ChartLayout[]): void {
  for (const chart of charts)
    attachChartInfoBox(chart);
}
