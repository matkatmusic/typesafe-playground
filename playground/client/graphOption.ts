import type { BarGeometry } from './graphTypes';
import { computeAverageBar, computeBarOffset, computeCallBar, computeRangeLine } from './graphGeometry';
import { computeSummary } from './graphValues';
import { createSvgNode } from './svgDom';

function createBarRect(bar: BarGeometry, fill: string): SVGElement {
  return createSvgNode('rect', { x: bar.x, y: bar.y, width: bar.width, height: bar.height, fill: fill });
}

export function renderOption(svg: Element, values: number[], slotX: number, plotH: number, isAverageShown: boolean): void {
  const stat = computeSummary(values);
  const offset = computeBarOffset(isAverageShown);
  if (isAverageShown) {
    const averageBar = computeAverageBar(slotX, stat.average, plotH);
    svg.appendChild(createBarRect(averageBar, 'var(--confidence)'));
    const rangeLine = computeRangeLine(slotX, stat, plotH);
    svg.appendChild(createSvgNode('line', { x1: rangeLine.x, x2: rangeLine.x, y1: rangeLine.y1, y2: rangeLine.y2, stroke: 'var(--text)', 'stroke-width': 1.5 }));
  }
  for (let k = 0; k < values.length; k++) {
    const callBar = computeCallBar(slotX, offset, k, values[k], plotH);
    svg.appendChild(createBarRect(callBar, 'var(--score)'));
  }
}
