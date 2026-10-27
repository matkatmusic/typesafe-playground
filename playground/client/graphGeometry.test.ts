import { test, expect } from 'bun:test';
import type { Question } from '@typesafe-ai/sdk';
import {
  BAR_W, BOTTOM, computeAverageBar, computeBarOffset, computeBaseline, computeCallBar, computePlotHeight, computeRangeLine, computeSlotLeft,
  computeSlotWidth, computeY, LEFT, MIN_BAR_H, MIN_PLOT_H, NOUL_BASELINE, OPTION_GAP, TICK_COUNT, TOP,
} from './graphGeometry';

function validateComputeY() {
  expect(computeY(1, 100)).toBe(TOP);
  expect(computeY(0, 100)).toBe(TOP + 100);
}

function validatePlotHeightHasAFloor() {
  expect(computePlotHeight(0)).toBe(MIN_PLOT_H);
  expect(computePlotHeight(TOP + BOTTOM + 200)).toBe(200);
}

function validateSlotWidth() {
  expect(computeSlotWidth(1, false)).toBe(16 + OPTION_GAP);
  expect(computeSlotWidth(4, false)).toBe(4 * BAR_W + OPTION_GAP);
  expect(computeSlotWidth(4, true)).toBe(5 * BAR_W + OPTION_GAP);
  expect(computeSlotLeft(2, 30)).toBe(LEFT + 60 + OPTION_GAP / 2);
  expect(computeBarOffset(true)).toBe(BAR_W);
  expect(computeBarOffset(false)).toBe(0);
}

function validateBars() {
  const callBar = computeCallBar(100, BAR_W, 2, 0.5, 100, 0);
  expect(callBar).toEqual({ x: 100 + BAR_W + 2 * BAR_W, y: TOP + 50, width: BAR_W - 1, height: 50 });
  const averageBar = computeAverageBar(100, 0.25, 100, 0);
  expect(averageBar).toEqual({ x: 100, y: TOP + 75, width: BAR_W - 1, height: 25 });
  const rangeLine = computeRangeLine(100, { low: 0.2, high: 0.6, average: 0.4 }, 100);
  expect(rangeLine).toEqual({ x: 100 + (BAR_W - 1) / 2, y1: TOP + 40, y2: TOP + 80 });
}

function validateNoulBarsStartAtTheMiddle() {
  expect(computeBaseline({ type: 'noul' })).toBe(NOUL_BASELINE);
  expect(computeBaseline({ type: 'score', criteria: ['a', 'b'] } as Question)).toBe(0);
  const up = computeCallBar(100, 0, 0, 0.9, 100, NOUL_BASELINE);
  expect(up.y).toBeCloseTo(TOP + 10);
  expect(up.height).toBeCloseTo(40);
  const down = computeCallBar(100, 0, 0, 0.2, 100, NOUL_BASELINE);
  expect(down.y).toBeCloseTo(TOP + 50);
  expect(down.height).toBeCloseTo(30);
  const flat = computeAverageBar(100, 0.5, 100, NOUL_BASELINE);
  expect(flat.y).toBeCloseTo(TOP + 50 - MIN_BAR_H / 2);
  expect(flat.height).toBe(MIN_BAR_H);
}

function validateNoulBarsAreAtLeast3pxTall() {
  const slightlyUp = computeCallBar(100, 0, 0, 0.51, 100, NOUL_BASELINE);
  expect(slightlyUp.height).toBe(MIN_BAR_H);
  expect(slightlyUp.y).toBeCloseTo(TOP + 50 - MIN_BAR_H);
  const slightlyDown = computeCallBar(100, 0, 0, 0.49, 100, NOUL_BASELINE);
  expect(slightlyDown.height).toBe(MIN_BAR_H);
  expect(slightlyDown.y).toBeCloseTo(TOP + 50);
  const tallDown = computeCallBar(100, 0, 0, 0.2, 100, NOUL_BASELINE);
  expect(tallDown.height).toBeCloseTo(30);
}

function validateScoreBarsKeepTheirHeight() {
  expect(computeCallBar(100, 0, 0, 0, 100, 0).height).toBe(0);
  expect(computeCallBar(100, 0, 0, 0.01, 100, 0).height).toBeCloseTo(1);
}

function validateTicksDrawSixGridLines() {
  expect(TICK_COUNT + 1).toBe(6);
}

test('test_compute_y_maps_value_to_height', validateComputeY);
test('test_plot_height_keeps_a_minimum', validatePlotHeightHasAFloor);
test('test_slot_width_and_offsets', validateSlotWidth);
test('test_bar_geometry', validateBars);
test('test_noul_bars_start_at_the_middle', validateNoulBarsStartAtTheMiddle);
test('test_noul_bars_are_at_least_3px_tall', validateNoulBarsAreAtLeast3pxTall);
test('test_score_bars_keep_their_height', validateScoreBarsKeepTheirHeight);
test('test_ticks_draw_six_grid_lines', validateTicksDrawSixGridLines);
