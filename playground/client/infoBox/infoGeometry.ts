import type { BarGeometry } from '../graphs/graphTypes';
import type { LabelPoint } from './infoTypes';
import { computeBarSpan, getBarWidth, getMinHitHeight } from '../graphs/graphGeometry';
import { computeSummary } from '../graphs/graphValues';


export function computeHitBar(slotX: number, offset: number, callIndex: number, values: number[], plotH: number, baseline: number): BarGeometry {
    const hitValue = callIndex < 0 ? computeSummary(values).average : values[callIndex];
    const hitX = callIndex < 0 ? slotX : slotX + offset + callIndex * getBarWidth();
    const span = computeBarSpan(hitValue, baseline, plotH);
    const hitHeight = Math.max(span.height, getMinHitHeight());
    return { x: hitX, y: span.y - (hitHeight - span.height) / 2, width: getBarWidth() - 1, height: hitHeight };
}

export function computeAverageLabelPoint(slotX: number, average: number, plotH: number, baseline: number): LabelPoint {
    const LABEL_LIFT = 3;
    const LABEL_SHIFT = 7;
    return { x: slotX + LABEL_SHIFT, y: computeBarSpan(average, baseline, plotH).y - LABEL_LIFT };
}

export function computeCallLabelPoint(slotX: number, offset: number, callIndex: number, value: number, plotH: number, baseline: number): LabelPoint {
    const LABEL_LIFT = 3;
    const LABEL_SHIFT = 7;
    return { x: slotX + offset + callIndex * getBarWidth() + LABEL_SHIFT, y: computeBarSpan(value, baseline, plotH).y - LABEL_LIFT };
}
