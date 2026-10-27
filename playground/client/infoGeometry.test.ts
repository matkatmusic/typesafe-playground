import { test, expect } from 'bun:test';
import { BAR_W, TOP } from './graphGeometry';
import { computeAverageLabelPoint, computeCallLabelPoint, computeHitBar } from './infoGeometry';

function validateHitBarsAndLabels() {
  const values = [0.2, 0.6];
  expect(computeHitBar(100, BAR_W, -1, values, 100)).toEqual({ x: 100, y: TOP + 60, width: BAR_W - 1, height: 40 });
  expect(computeHitBar(100, BAR_W, 1, values, 100)).toEqual({ x: 100 + BAR_W + BAR_W, y: TOP + 40, width: BAR_W - 1, height: 60 });
  expect(computeAverageLabelPoint(100, 0.5, 100)).toEqual({ x: 107, y: TOP + 50 - 3 });
  expect(computeCallLabelPoint(100, BAR_W, 1, 0.5, 100)).toEqual({ x: 100 + BAR_W + BAR_W + 7, y: TOP + 50 - 3 });
}

test('test_hit_bars_and_label_points', validateHitBarsAndLabels);
