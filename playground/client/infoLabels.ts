import type { LabelPoint } from './infoTypes';
import { computeBarOffset } from './graphGeometry';
import { computeSummary } from './graphValues';
import { computeAverageLabelPoint, computeCallLabelPoint } from './infoGeometry';
import { createSvgNode } from './svgDom';

const LABEL_STYLE = 'font-size: 9px; fill: var(--text)';

function createRotatedLabel(point: LabelPoint, text: string): SVGElement {
  const transform = 'rotate(-90 ' + point.x + ' ' + point.y + ')';
  return createSvgNode('text', { x: point.x, y: point.y, transform: transform, style: LABEL_STYLE }, text);
}

export function renderValueLabels(svg: Element, values: number[], slotX: number, plotH: number, isAverageShown: boolean): void {
  const group = createSvgNode('g', { class: 'value-labels', 'pointer-events': 'none' });
  const offset = computeBarOffset(isAverageShown);
  if (isAverageShown) {
    const stat = computeSummary(values);
    const averagePoint = computeAverageLabelPoint(slotX, stat.average, plotH);
    group.appendChild(createRotatedLabel(averagePoint, stat.average.toFixed(3)));
  }
  for (let k = 0; k < values.length; k++) {
    const callPoint = computeCallLabelPoint(slotX, offset, k, values[k], plotH);
    group.appendChild(createRotatedLabel(callPoint, values[k].toFixed(3)));
  }
  svg.appendChild(group);
}

export function removeValueLabels(svg: Element): void {
  const group = svg.querySelector('.value-labels');
  if (group !== null)
    group.remove();
}
