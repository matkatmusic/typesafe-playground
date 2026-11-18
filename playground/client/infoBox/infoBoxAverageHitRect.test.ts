import { test, expect } from 'bun:test';
import { graphState } from '../graphs/graphState';
import { renderNoulBlock, removeFakeDocument, type FakeElement } from './infoBoxFakeDom';

function validateAverageAddsAnAverageHitRectFirst() {
    graphState.averageShownByName.q = true;
    const block = renderNoulBlock();
    const svg = block.children[1].children[0];
    const hits: FakeElement[] = [];
    for (const child of svg.children) {
        if (child.attrs.fill === 'transparent')
            hits.push(child);
    }
    expect(hits.length).toBe(2);
    removeFakeDocument();
}

test('test_average_adds_an_average_hit_rect', validateAverageAddsAnAverageHitRectFirst);
