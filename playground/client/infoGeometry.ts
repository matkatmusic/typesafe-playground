import type { BarGeometry } from './graphTypes';
import type { LabelPoint } from './infoTypes';
import { BAR_W, computeY } from './graphGeometry';
import { computeSummary } from './graphValues';

export const LABEL_LIFT = 3;
export const LABEL_SHIFT = 7;

export function computeHitBar(slotX: number, offset: number, callIndex: number, values: number[], plotH: number): BarGeometry {
  const hitValue = callIndex < 0 ? computeSummary(values).average : values[callIndex];
  const hitX = callIndex < 0 ? slotX : slotX + offset + callIndex * BAR_W;
  return { x: hitX, y: computeY(hitValue, plotH), width: BAR_W - 1, height: plotH * hitValue };
}

export function computeAverageLabelPoint(slotX: number, average: number, plotH: number): LabelPoint {
  return { x: slotX + LABEL_SHIFT, y: computeY(average, plotH) - LABEL_LIFT };
}

export function computeCallLabelPoint(slotX: number, offset: number, callIndex: number, value: number, plotH: number): LabelPoint {
  return { x: slotX + offset + callIndex * BAR_W + LABEL_SHIFT, y: computeY(value, plotH) - LABEL_LIFT };
}
