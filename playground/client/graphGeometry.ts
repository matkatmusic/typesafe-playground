import type { Question } from '@typesafe-ai/sdk';
import type { BarGeometry, BarSpan, RangeLineGeometry, Summary } from './graphTypes';

export const BAR_W = 8;
export const OPTION_GAP = 14;
export const LEFT = 44;
export const TOP = 30;
export const BOTTOM = 14;
export const MIN_PLOT_H = 40;
export const TICK_COUNT = 5;
export const NOUL_BASELINE = 0.5;
export const MIN_HIT_H = 3;
export const MIN_BAR_H = 3;
export const MIN_SLOT_BARS_WIDTH = 16;
export const PINNED_PAD = 2;

export function computeY(value: number, plotH: number): number {
  return TOP + plotH * (1 - value);
}

export function computePlotHeight(boxHeight: number): number {
  return Math.max(boxHeight - TOP - BOTTOM, MIN_PLOT_H);
}

export function computeSlotWidth(barCount: number, isAverageShown: boolean): number {
  const slotBars = barCount + (isAverageShown ? 1 : 0);
  return Math.max(slotBars * BAR_W, MIN_SLOT_BARS_WIDTH) + OPTION_GAP;
}

export function computeBarOffset(isAverageShown: boolean): number {
  return isAverageShown ? BAR_W : 0;
}

export function computeBaseline(question: Question): number {
  return question.type === 'noul' ? NOUL_BASELINE : 0;
}

export function computeRaisedHeight(value: number, baseline: number, height: number): number {
  if (value > baseline)
    return height;
  if (value === baseline)
    return height / 2;
  return 0;
}

export function computeMinHeightSpan(value: number, baseline: number, plotH: number): BarSpan {
  const height = Math.max(plotH * Math.abs(value - baseline), MIN_BAR_H);
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
    x: slotX + offset + callIndex * BAR_W,
    ...computeBarSpan(value, baseline, plotH),
    width: BAR_W - 1,
  };
}

export function computeAverageBar(slotX: number, average: number, plotH: number, baseline: number): BarGeometry {
  return {
    x: slotX,
    ...computeBarSpan(average, baseline, plotH),
    width: BAR_W - 1,
  };
}

export function computePinnedBar(bar: BarGeometry): BarGeometry {
  return { ...bar, x: bar.x - PINNED_PAD, width: bar.width + 2 * PINNED_PAD };
}

export function computeRangeLine(slotX: number, stat: Summary, plotH: number): RangeLineGeometry {
  return {
    x: slotX + (BAR_W - 1) / 2,
    y1: computeY(stat.high, plotH),
    y2: computeY(stat.low, plotH),
  };
}

export function computeSlotLeft(columnIndex: number, slot: number): number {
  return LEFT + columnIndex * slot + OPTION_GAP / 2;
}
