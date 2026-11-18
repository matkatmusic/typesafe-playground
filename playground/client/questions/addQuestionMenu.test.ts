import { test, expect } from 'bun:test';
import { getMenuItems, setMenuPosition } from './addQuestionMenu';

function createStubElement(rect: object, offsetHeight: number): HTMLElement {
    function getRect(): object {
        return rect;
    }
    const stub = { getBoundingClientRect: getRect, offsetHeight: offsetHeight, style: {} };
    return stub as unknown as HTMLElement;
}

function computeMenuTop(viewportHeight: number): string {
    Object.assign(globalThis, { window: { innerHeight: viewportHeight } });
    const button = createStubElement({ left: 10, top: 150, bottom: 170 }, 0);
    const menu = createStubElement({}, 100);
    setMenuPosition(menu, button);
    Reflect.deleteProperty(globalThis, 'window');
    return menu.style.top;
}

function validateMenuItemsHaveTitleAndDescription() {
    const menuItems = getMenuItems();
    expect(menuItems.length).toBe(3);
    expect(menuItems[0]).toEqual({ type: 'noul', title: 'Noul', description: 'Evaluate how true something is' });
    expect(menuItems[1]).toEqual({ type: 'score', title: 'Score', description: 'Set up and grade with a rubric' });
    expect(menuItems[2]).toEqual({ type: 'choice', title: 'Choice', description: 'Ask a multiple choice question' });
}

function validateMenuOpensBelowWhenThereIsRoom() {
    expect(computeMenuTop(600)).toBe('174px');
}

function validateMenuFlipsAboveWhenThereIsNoRoom() {
    expect(computeMenuTop(200)).toBe('46px');
}

test('test_menu_items_have_title_and_description', validateMenuItemsHaveTitleAndDescription);
test('test_menu_opens_below_when_there_is_room', validateMenuOpensBelowWhenThereIsRoom);
test('test_menu_flips_above_when_there_is_no_room', validateMenuFlipsAboveWhenThereIsNoRoom);
