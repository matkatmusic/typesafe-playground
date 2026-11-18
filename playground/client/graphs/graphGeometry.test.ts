import { test, expect } from 'bun:test';
import type { Question } from '@typesafe-ai/sdk';
import {
    computeAverageBar, computeBarOffset, computeBaseline, computeCallBar, computePinnedBar, computePlotHeight, computeRangeLine, computeSlotLeft,
    computeSlotWidth, computeY, getBarWidth, getBottomMargin, getLeftMargin, getMinBarHeight, getMinPlotHeight, getNoulBaseline, getOptionGap, getPinnedPadding, getTickCount, getTopMargin,
} from './graphGeometry';

function validateComputeY() {
    expect(computeY(1, 100)).toBe(getTopMargin());
    expect(computeY(0, 100)).toBe(getTopMargin() + 100);
}

function validatePlotHeightHasAFloor() {
    expect(computePlotHeight(0)).toBe(getMinPlotHeight());
    expect(computePlotHeight(getTopMargin() + getBottomMargin() + 200)).toBe(200);
}

function validateSlotWidth() {
    expect(computeSlotWidth(1, false)).toBe(16 + getOptionGap());
    expect(computeSlotWidth(4, false)).toBe(4 * getBarWidth() + getOptionGap());
    expect(computeSlotWidth(4, true)).toBe(5 * getBarWidth() + getOptionGap());
    expect(computeSlotLeft(2, 30)).toBe(getLeftMargin() + 60 + getOptionGap() / 2);
    expect(computeBarOffset(true)).toBe(getBarWidth());
    expect(computeBarOffset(false)).toBe(0);
}

function validateBars() {
    const callBar = computeCallBar(100, getBarWidth(), 2, 0.5, 100, 0);
    expect(callBar).toEqual({ x: 100 + getBarWidth() + 2 * getBarWidth(), y: getTopMargin() + 50, width: getBarWidth() - 1, height: 50 });
    const averageBar = computeAverageBar(100, 0.25, 100, 0);
    expect(averageBar).toEqual({ x: 100, y: getTopMargin() + 75, width: getBarWidth() - 1, height: 25 });
    const rangeLine = computeRangeLine(100, { low: 0.2, high: 0.6, average: 0.4 }, 100);
    expect(rangeLine).toEqual({ x: 100 + (getBarWidth() - 1) / 2, y1: getTopMargin() + 40, y2: getTopMargin() + 80 });
}

function validateNoulBarsStartAtTheMiddle() {
    expect(computeBaseline({ type: 'noul' })).toBe(getNoulBaseline());
    expect(computeBaseline({ type: 'score', criteria: ['a', 'b'] } as Question)).toBe(0);
    const up = computeCallBar(100, 0, 0, 0.9, 100, getNoulBaseline());
    expect(up.y).toBeCloseTo(getTopMargin() + 10);
    expect(up.height).toBeCloseTo(40);
    const down = computeCallBar(100, 0, 0, 0.2, 100, getNoulBaseline());
    expect(down.y).toBeCloseTo(getTopMargin() + 50);
    expect(down.height).toBeCloseTo(30);
    const flat = computeAverageBar(100, 0.5, 100, getNoulBaseline());
    expect(flat.y).toBeCloseTo(getTopMargin() + 50 - getMinBarHeight() / 2);
    expect(flat.height).toBe(getMinBarHeight());
}

function validateNoulBarsAreAtLeast3pxTall() {
    const slightlyUp = computeCallBar(100, 0, 0, 0.51, 100, getNoulBaseline());
    expect(slightlyUp.height).toBe(getMinBarHeight());
    expect(slightlyUp.y).toBeCloseTo(getTopMargin() + 50 - getMinBarHeight());
    const slightlyDown = computeCallBar(100, 0, 0, 0.49, 100, getNoulBaseline());
    expect(slightlyDown.height).toBe(getMinBarHeight());
    expect(slightlyDown.y).toBeCloseTo(getTopMargin() + 50);
    const tallDown = computeCallBar(100, 0, 0, 0.2, 100, getNoulBaseline());
    expect(tallDown.height).toBeCloseTo(30);
}

function validateScoreBarsKeepTheirHeight() {
    expect(computeCallBar(100, 0, 0, 0, 100, 0).height).toBe(0);
    expect(computeCallBar(100, 0, 0, 0.01, 100, 0).height).toBeCloseTo(1);
}

function validatePinnedBarGrowsSidewaysOnly() {
    const plain = computeCallBar(100, 0, 0, 0.5, 100, 0);
    const padded = computePinnedBar(plain);
    expect(padded.x).toBe(plain.x - getPinnedPadding());
    expect(padded.width).toBe(plain.width + 2 * getPinnedPadding());
    expect(padded.y).toBe(plain.y);
    expect(padded.height).toBe(plain.height);
}

function validateTicksDrawSixGridLines() {
    expect(getTickCount() + 1).toBe(6);
}

test('test_compute_y_maps_value_to_height', validateComputeY);
test('test_plot_height_keeps_a_minimum', validatePlotHeightHasAFloor);
test('test_slot_width_and_offsets', validateSlotWidth);
test('test_bar_geometry', validateBars);
test('test_noul_bars_start_at_the_middle', validateNoulBarsStartAtTheMiddle);
test('test_noul_bars_are_at_least_3px_tall', validateNoulBarsAreAtLeast3pxTall);
test('test_score_bars_keep_their_height', validateScoreBarsKeepTheirHeight);
test('test_pinned_bar_grows_sideways_only', validatePinnedBarGrowsSidewaysOnly);
test('test_ticks_draw_six_grid_lines', validateTicksDrawSixGridLines);

function validateCallBarIsTwoPixelsWiderThanBefore() {
    const OLD_BAR_W = 8;
    expect(getBarWidth()).toBe(OLD_BAR_W + 2);
    const callBar = computeCallBar(100, 0, 0, 0.5, 100, 0);
    expect(callBar.width).toBe(OLD_BAR_W - 1 + 2);
}
test('test_call_bar_is_two_pixels_wider_than_before', validateCallBarIsTwoPixelsWiderThanBefore);
