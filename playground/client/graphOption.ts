import type { BarGeometry } from './graphTypes';
import { computeAverageBar, computeBarOffset, computeCallBar, computePinnedBar, computeRangeLine } from './graphGeometry';
import { computeSummary } from './graphValues';
import { createSvgNode } from './svgDom';

const PINNED_FILL = 'var(--text-muted)';
const PINNED_OPACITY = 0.35;

function createBarRect(bar: BarGeometry, fill: string, opacity: number): SVGElement {
  return createSvgNode('rect', { x: bar.x, y: bar.y, width: bar.width, height: bar.height, fill: fill, opacity: opacity });
}

function computeShownBar(bar: BarGeometry, isPinned: boolean): BarGeometry {
  if (isPinned)
    return computePinnedBar(bar);
  return bar;
}

export function renderOption(svg: Element, values: number[], slotX: number, plotH: number, isAverageShown: boolean, baseline: number, isPinned: boolean): void {
  const stat = computeSummary(values);
  const offset = computeBarOffset(isAverageShown);
  const opacity = isPinned ? PINNED_OPACITY : 1;
  if (isAverageShown) {
    const averageBar = computeShownBar(computeAverageBar(slotX, stat.average, plotH, baseline), isPinned);
    svg.appendChild(createBarRect(averageBar, isPinned ? PINNED_FILL : 'var(--confidence)', opacity));
    const rangeLine = computeRangeLine(slotX, stat, plotH);
    svg.appendChild(createSvgNode('line', { x1: rangeLine.x, x2: rangeLine.x, y1: rangeLine.y1, y2: rangeLine.y2, stroke: 'var(--text)', 'stroke-width': 1.5, opacity: opacity }));
  }
  for (let k = 0; k < values.length; k++) {
    const callBar = computeShownBar(computeCallBar(slotX, offset, k, values[k], plotH, baseline), isPinned);
    svg.appendChild(createBarRect(callBar, isPinned ? PINNED_FILL : 'var(--score)', opacity));
  }
}
