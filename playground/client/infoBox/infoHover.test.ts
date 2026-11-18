import { test, expect } from 'bun:test';
import { getHitStrokeColor, updateShownInfo } from './infoHover';
import type { HoverTracker } from './infoTypes';

function createFakeHit() {
    const attrs: Record<string, string> = {};
    return { attrs, setAttribute(key: string, value: string) {
        attrs[key] = value;
    }, removeAttribute(key: string) {
        delete attrs[key];
    } };
}

function createFakeTrackerWithAppendLog() {
    const appended: unknown[] = [];
    const block = { querySelector() {
        return null;
    }, appendChild(child: unknown) {
        appended.push(child);
    } };
    const tracker = { block, shownHit: null } as unknown as HoverTracker;
    return { appended, tracker };
}

function validateOutlineMovesToTheLatestHit() {
    const { appended, tracker } = createFakeTrackerWithAppendLog();
    const first = createFakeHit();
    const second = createFakeHit();
    const info = {} as HTMLElement;
    updateShownInfo(tracker, info, first as unknown as Element);
    expect(first.attrs.stroke).toBe('var(--hit-stroke)');
    updateShownInfo(tracker, info, second as unknown as Element);
    expect(first.attrs.stroke).toBeUndefined();
    expect(second.attrs.stroke).toBe(getHitStrokeColor());
    expect(appended.length).toBe(2);
}

function validateOldInfoBoxIsRemoved() {
    let removeCount = 0;
    function removeShown() {
        removeCount++;
    }
    const block = { querySelector() {
        return { remove: removeShown };
    }, appendChild() {} };
    const tracker = { block, shownHit: null } as unknown as HoverTracker;
    updateShownInfo(tracker, {} as HTMLElement, null);
    expect(removeCount).toBe(1);
    expect(tracker.shownHit).toBeNull();
}

test('test_outline_moves_to_the_latest_hit', validateOutlineMovesToTheLatestHit);
test('test_old_info_box_is_removed', validateOldInfoBoxIsRemoved);

function validateHitStrokeColorIsTheThemeVariable() {
    expect(getHitStrokeColor()).toBe('var(--hit-stroke)');
}
test('test_hit_stroke_color_is_the_theme_variable', validateHitStrokeColorIsTheThemeVariable);
