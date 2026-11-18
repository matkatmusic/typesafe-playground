import { describe, test, expect, afterEach } from 'bun:test';
import { renderNoulBlock, listByName, getLowNoulVersion, removeFakeDocument, type FakeElement } from './infoBoxFakeDom';

function isValueLabelGroup(group: FakeElement): boolean {
    return group.attrs.class === 'value-labels';
}

function listValueLabelGroups(svg: FakeElement): FakeElement[] {
    const labelGroups: FakeElement[] = [];
    for (const group of listByName(svg.children, 'g')) {
        const isValueLabels = isValueLabelGroup(group);
        if (isValueLabels)
            labelGroups.push(group);
    }
    return labelGroups;
}

function listTransparentHits(svg: FakeElement): FakeElement[] {
    const hits: FakeElement[] = [];
    for (const child of svg.children) {
        if (child.attrs.fill === 'transparent')
            hits.push(child);
    }
    return hits;
}

function validateDefaultBoxShowsYes(block: FakeElement) {
    const defaultBox = block.children[2];
    expect(defaultBox.className).toBe('bar-info');
    expect(defaultBox.children.length).toBe(10);
    expect(defaultBox.children[1].children[0].textContent).toBe('yes');
}

function validateShownBoxAfterHover(block: FakeElement) {
    const shownBox = block.children[block.children.length - 1];
    expect(shownBox.children.length).toBe(10);
    expect(shownBox.children[9].children[0].children[0].textContent).toBe('is yes');
}

function validateNoulHoverDoesNotThrowAndShowsTheValue() {
    const block = renderNoulBlock();
    const svg = block.children[1].children[0];
    const hits = listTransparentHits(svg);
    expect(hits.length).toBe(1);
    validateDefaultBoxShowsYes(block);
    expect(hits[0].attrs.stroke).toBe('var(--hit-stroke)');
    hits[0].listeners.mouseenter();
    expect(hits[0].attrs.stroke).toBe('var(--hit-stroke)');
    const labels = listValueLabelGroups(svg);
    expect(labels.length).toBe(1);
    expect(labels[0].children[0].textContent).toBe('0.800');
    validateShownBoxAfterHover(block);
}

function validateLowNoulChoiceShowsNoBeforeAndAfterHover() {
    const block = renderNoulBlock(getLowNoulVersion());
    const svg = block.children[1].children[0];
    const hits = listTransparentHits(svg);
    const defaultBox = block.children[2];
    expect(defaultBox.children[1].children[0].textContent).toBe('no');
    hits[0].listeners.mouseenter();
    expect(defaultBox.children[1].children[0].textContent).toBe('no');
}

function registerInfoBoxTests() {
    afterEach(removeFakeDocument);
    test('test_noul_hover_does_not_throw_and_shows_the_value', validateNoulHoverDoesNotThrowAndShowsTheValue);
    test('test_low_noul_choice_shows_no_before_and_after_hover', validateLowNoulChoiceShowsNoBeforeAndAfterHover);
}

describe('infoBox', registerInfoBoxTests);
