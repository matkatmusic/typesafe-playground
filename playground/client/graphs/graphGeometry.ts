import type { Question } from '@typesafe-ai/sdk';
import type { BarGeometry, BarSpan, RangeLineGeometry, Summary } from './graphTypes';

export function getBarWidth(): number {
    return 10;
}

export function getOptionGap(): number {
    return 14;
}

export function getLeftMargin(): number {
    return 44;
}

export function getTopMargin(): number {
    return 30;
}

export function getBottomMargin(): number {
    return 14;
}

export function getMinPlotHeight(): number {
    return 40;
}

export function getTickCount(): number {
    return 5;
}

export function getNoulBaseline(): number {
    return 0.5;
}

export function getMinHitHeight(): number {
    return 3;
}

export function getMinBarHeight(): number {
    return 3;
}

export function getMinSlotBarsWidth(): number {
    return 16;
}

export function getPinnedPadding(): number {
    return 2;
}

export function computeY(value: number, plotH: number): number {
    return getTopMargin() + plotH * (1 - value);
}

export function computePlotHeight(boxHeight: number): number {
    return Math.max(boxHeight - getTopMargin() - getBottomMargin(), getMinPlotHeight());
}

export function computeSlotWidth(barCount: number, isAverageShown: boolean): number {
    const slotBars = barCount + (isAverageShown ? 1 : 0);
    return Math.max(slotBars * getBarWidth(), getMinSlotBarsWidth()) + getOptionGap();
}

export function computeBarOffset(isAverageShown: boolean): number {
    return isAverageShown ? getBarWidth() : 0;
}

export function computeBaseline(question: Question): number {
    return question.type === 'noul' ? getNoulBaseline() : 0;
}

export function computeRaisedHeight(value: number, baseline: number, height: number): number {
    if (value > baseline)
        return height;
    if (value === baseline)
        return height / 2;
    return 0;
}

export function computeMinHeightSpan(value: number, baseline: number, plotH: number): BarSpan {
    const height = Math.max(plotH * Math.abs(value - baseline), getMinBarHeight());
    const raisedHeight = computeRaisedHeight(value, baseline, height);
    return { y: computeY(baseline, plotH) - raisedHeight, height: height };
}

export function computeBarSpan(value: number, baseline: number, plotH: number): BarSpan {
    const isFromZero = baseline === 0;
    if (isFromZero)
        return { y: computeY(Math.max(value, baseline), plotH), height: plotH * Math.abs(value - baseline) };
    return computeMinHeightSpan(value, baseline, plotH);
}

export function computeCallBar(slotX: number, offset: number, callIndex: number, value: number, plotH: number, baseline: number): BarGeometry {
    return {
        x: slotX + offset + callIndex * getBarWidth(),
        ...computeBarSpan(value, baseline, plotH),
        width: getBarWidth() - 1,
    };
}

export function computeAverageBar(slotX: number, average: number, plotH: number, baseline: number): BarGeometry {
    return {
        x: slotX,
        ...computeBarSpan(average, baseline, plotH),
        width: getBarWidth() - 1,
    };
}

export function computePinnedBar(bar: BarGeometry): BarGeometry {
    return { ...bar, x: bar.x - getPinnedPadding(), width: bar.width + 2 * getPinnedPadding() };
}

export function computeRangeLine(slotX: number, stat: Summary, plotH: number): RangeLineGeometry {
    return {
        x: slotX + (getBarWidth() - 1) / 2,
        y1: computeY(stat.high, plotH),
        y2: computeY(stat.low, plotH),
    };
}

export function computeSlotLeft(columnIndex: number, slot: number): number {
    return getLeftMargin() + columnIndex * slot + getOptionGap() / 2;
}
