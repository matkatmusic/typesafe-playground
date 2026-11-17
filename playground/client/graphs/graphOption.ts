import type { BarGeometry } from './graphTypes';
import { BAR_W, computeAverageBar, computeBarOffset, computeCallBar, computePinnedBar, computeRangeLine, computeY } from './graphGeometry';
import { computeSummary } from './graphValues';
import { createSvgNode } from './svgDom';
import type { Provider } from '../../history/playgroundHistory';

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

export function computeProviderLetter(provider: Provider): string {
  if (provider === 'SubQ')
    return 's';
  return 't';
}

export function renderProviderLetters(svg: Element, providers: Provider[], slotX: number, plotH: number, isAverageShown: boolean, isPinned: boolean): void {
  const offset = computeBarOffset(isAverageShown);
  const group = createSvgNode('g', { class: 'provider-letters', 'pointer-events': 'none' });
  const rowY = computeY(0, plotH) + (isPinned ? 22 : 11);
  for (let k = 0; k < providers.length; k++) {
    const centerX = slotX + offset + k * BAR_W + (BAR_W - 1) / 2;
    const attrs = { x: centerX, y: rowY, 'text-anchor': 'middle', 'font-size': 9 };
    if (isPinned)
      group.appendChild(createSvgNode('text', { ...attrs, fill: PINNED_FILL }, computeProviderLetter(providers[k])));
    else
      group.appendChild(createSvgNode('text', attrs, computeProviderLetter(providers[k])));
  }
  svg.appendChild(group);
}

export function computeProviderFill(provider: Provider): string {
  if (provider === 'SubQ')
    // return 'rgb(77, 121, 57)';
    return '#56B4E9';
  // return 'rgb(201, 112, 157)';
  return '#009E73';
}

// export function renderOption(svg: Element, values: number[], slotX: number, plotH: number, isAverageShown: boolean, baseline: number, isPinned: boolean): void {
export function renderOption(svg: Element, values: number[], slotX: number, plotH: number, isAverageShown: boolean, baseline: number, isPinned: boolean, providers: Provider[]): void {
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
    // svg.appendChild(createBarRect(callBar, isPinned ? PINNED_FILL : 'var(--score)', opacity));
    svg.appendChild(createBarRect(callBar, computeProviderFill(providers[k]), opacity));
  }
}
