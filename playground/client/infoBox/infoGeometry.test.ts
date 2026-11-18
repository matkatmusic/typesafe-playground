import { test, expect } from 'bun:test';
import { getBarWidth, getMinHitHeight, getTopMargin } from '../graphs/graphGeometry';
import { computeAverageLabelPoint, computeCallLabelPoint, computeHitBar } from './infoGeometry';

function validateHitBarsAndLabels() {
    const values = [0.2, 0.6];
    expect(computeHitBar(100, getBarWidth(), -1, values, 100, 0)).toEqual({ x: 100, y: getTopMargin() + 60, width: getBarWidth() - 1, height: 40 });
    expect(computeHitBar(100, getBarWidth(), 1, values, 100, 0)).toEqual({ x: 100 + getBarWidth() + getBarWidth(), y: getTopMargin() + 40, width: getBarWidth() - 1, height: 60 });
    expect(computeAverageLabelPoint(100, 0.5, 100, 0)).toEqual({ x: 107, y: getTopMargin() + 50 - 3 });
    expect(computeCallLabelPoint(100, getBarWidth(), 1, 0.5, 100, 0)).toEqual({ x: 100 + getBarWidth() + getBarWidth() + 7, y: getTopMargin() + 50 - 3 });
}

function validateNoulHitBarsStartAtTheMiddleAndFlatBarsStayHoverable() {
    const values = [0.2, 0.5, 0.9];
    expect(computeHitBar(100, 0, 0, values, 100, 0.5)).toEqual({ x: 100, y: getTopMargin() + 50, width: getBarWidth() - 1, height: 30 });
    const flat = computeHitBar(100, 0, 1, values, 100, 0.5);
    expect(flat.height).toBe(getMinHitHeight());
    expect(flat.y).toBeCloseTo(getTopMargin() + 50 - getMinHitHeight() / 2);
    expect(computeCallLabelPoint(100, 0, 0, 0.2, 100, 0.5).y).toBe(getTopMargin() + 50 - 3);
}

test('test_hit_bars_and_label_points', validateHitBarsAndLabels);
test('test_noul_hit_bars_start_at_the_middle_and_flat_bars_stay_hoverable', validateNoulHitBarsStartAtTheMiddleAndFlatBarsStayHoverable);
