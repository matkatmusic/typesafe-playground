import type { BarGeometry } from './graphTypes';
import type { LabelPoint } from './infoTypes';
import { BAR_W, computeBarSpan, MIN_HIT_H } from './graphGeometry';
import { computeSummary } from './graphValues';

export const LABEL_LIFT = 3;
export const LABEL_SHIFT = 7;

export function computeHitBar(slotX: number, offset: number, callIndex: number, values: number[], plotH: number, baseline: number): BarGeometry {
  const hitValue = callIndex < 0 ? computeSummary(values).average : values[callIndex];
  const hitX = callIndex < 0 ? slotX : slotX + offset + callIndex * BAR_W;
  const span = computeBarSpan(hitValue, baseline, plotH);
  const hitHeight = Math.max(span.height, MIN_HIT_H);
  return { x: hitX, y: span.y - (hitHeight - span.height) / 2, width: BAR_W - 1, height: hitHeight };
}

export function computeAverageLabelPoint(slotX: number, average: number, plotH: number, baseline: number): LabelPoint {
  return { x: slotX + LABEL_SHIFT, y: computeBarSpan(average, baseline, plotH).y - LABEL_LIFT };
}

export function computeCallLabelPoint(slotX: number, offset: number, callIndex: number, value: number, plotH: number, baseline: number): LabelPoint {
  return { x: slotX + offset + callIndex * BAR_W + LABEL_SHIFT, y: computeBarSpan(value, baseline, plotH).y - LABEL_LIFT };
}
