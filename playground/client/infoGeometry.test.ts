import { test, expect } from 'bun:test';
import { BAR_W, MIN_HIT_H, TOP } from './graphGeometry';
import { computeAverageLabelPoint, computeCallLabelPoint, computeHitBar } from './infoGeometry';

function validateHitBarsAndLabels() {
  const values = [0.2, 0.6];
  expect(computeHitBar(100, BAR_W, -1, values, 100, 0)).toEqual({ x: 100, y: TOP + 60, width: BAR_W - 1, height: 40 });
  expect(computeHitBar(100, BAR_W, 1, values, 100, 0)).toEqual({ x: 100 + BAR_W + BAR_W, y: TOP + 40, width: BAR_W - 1, height: 60 });
  expect(computeAverageLabelPoint(100, 0.5, 100, 0)).toEqual({ x: 107, y: TOP + 50 - 3 });
  expect(computeCallLabelPoint(100, BAR_W, 1, 0.5, 100, 0)).toEqual({ x: 100 + BAR_W + BAR_W + 7, y: TOP + 50 - 3 });
}

function validateNoulHitBarsStartAtTheMiddleAndFlatBarsStayHoverable() {
  const values = [0.2, 0.5, 0.9];
  expect(computeHitBar(100, 0, 0, values, 100, 0.5)).toEqual({ x: 100, y: TOP + 50, width: BAR_W - 1, height: 30 });
  const flat = computeHitBar(100, 0, 1, values, 100, 0.5);
  expect(flat.height).toBe(MIN_HIT_H);
  expect(flat.y).toBeCloseTo(TOP + 50 - MIN_HIT_H / 2);
  expect(computeCallLabelPoint(100, 0, 0, 0.2, 100, 0.5).y).toBe(TOP + 50 - 3);
}

test('test_hit_bars_and_label_points', validateHitBarsAndLabels);
test('test_noul_hit_bars_start_at_the_middle_and_flat_bars_stay_hoverable', validateNoulHitBarsStartAtTheMiddleAndFlatBarsStayHoverable);
