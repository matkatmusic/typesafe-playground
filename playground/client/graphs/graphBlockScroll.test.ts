import { test, expect, afterEach, describe } from 'bun:test';
import { graphState } from './graphState';
import { createAverageToggle, createCollapseButton } from './graphBlock';
import { getFakeElementById, installFakeDocument, removeFakeDocument } from './graphBlockFakeDom';
import type { FakeElement } from './graphBlockFakeDom';

function validateCollapseButtonShowsStateAndFlipsIt() {
    installFakeDocument();
    let renderCount = 0;
    function countRender() {
        renderCount++;
    }
    const button = createCollapseButton('q', countRender) as unknown as FakeElement;
    expect(button.textContent).toBe('▼');
    button.listeners.click();
    expect(graphState.collapsedByName.q).toBe(true);
    expect(renderCount).toBe(1);
}

function createScrollResetter(container: FakeElement) {
    return function resetScrollLikeTheRedraw() {
        container.scrollTop = 0;
    };
}

function validateExpandingScrollsTheRebuiltBlockIntoView() {
    installFakeDocument();
    const events: unknown[] = [];
    function pushRenderEvent() {
        events.push('onChange');
    }
    function pushScrollEvent(options: unknown) {
        events.push(options);
    }
    getFakeElementById('graphBlockq').scrollIntoView = pushScrollEvent;
    graphState.collapsedByName.q = true;
    const expandButton = createCollapseButton('q', pushRenderEvent) as unknown as FakeElement;
    expandButton.listeners.click();
    expect(events).toEqual(['onChange', { block: 'nearest' }]);
}

function validateCollapsingDoesNotScrollTheRebuiltBlockIntoView() {
    installFakeDocument();
    const events: unknown[] = [];
    function pushRenderEvent() {
        events.push('onChange');
    }
    function pushScrollEvent(options: unknown) {
        events.push(options);
    }
    getFakeElementById('graphBlockq').scrollIntoView = pushScrollEvent;
    graphState.collapsedByName.q = false;
    const collapseButton = createCollapseButton('q', pushRenderEvent) as unknown as FakeElement;
    collapseButton.listeners.click();
    expect(events).toEqual(['onChange']);
}

function validateCollapsingKeepsTheScrollPositionThatTheRedrawResets() {
    installFakeDocument();
    const container = getFakeElementById('graphContainerBox');
    container.scrollTop = 500;
    let scrollIntoViewCount = 0;
    function countScrollIntoView() {
        scrollIntoViewCount++;
    }
    getFakeElementById('graphBlockq').scrollIntoView = countScrollIntoView;
    const collapseButton = createCollapseButton('q', createScrollResetter(container)) as unknown as FakeElement;
    collapseButton.listeners.click();
    expect(container.scrollTop).toBe(500);
    expect(scrollIntoViewCount).toBe(0);
}

function validateChangingTheAverageCheckboxKeepsTheScrollPositionThatTheRedrawResets() {
    installFakeDocument();
    const container = getFakeElementById('graphContainerBox');
    container.scrollTop = 500;
    const toggle = createAverageToggle('q', createScrollResetter(container)) as unknown as FakeElement;
    const checkbox = toggle.children[0] as FakeElement;
    checkbox.checked = true;
    checkbox.listeners.change();
    expect(container.scrollTop).toBe(500);
    expect(graphState.averageShownByName.q).toBe(true);
    graphState.averageShownByName = {};
}

function registerScrollTests() {
    afterEach(removeFakeDocument);
    test('test_collapse_button_shows_state_and_flips_it', validateCollapseButtonShowsStateAndFlipsIt);
    test('test_expanding_scrolls_the_rebuilt_block_into_view', validateExpandingScrollsTheRebuiltBlockIntoView);
    test('test_collapsing_does_not_scroll_the_rebuilt_block_into_view', validateCollapsingDoesNotScrollTheRebuiltBlockIntoView);
    test('test_collapsing_keeps_the_scroll_position_that_the_redraw_resets', validateCollapsingKeepsTheScrollPositionThatTheRedrawResets);
    test('test_changing_the_average_checkbox_keeps_the_scroll_position_that_the_redraw_resets', validateChangingTheAverageCheckboxKeepsTheScrollPositionThatTheRedrawResets);
}

describe('graphBlockScroll', registerScrollTests);
