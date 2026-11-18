import { test, expect, afterEach, describe } from 'bun:test';
import { getBodyChildren, removeFakeDocument, collectAppendReferenceText } from './backtickTooltipFakeDom';

function validateFoundReferenceBecomesASpanWithoutATitle() {
    const nodes = collectAppendReferenceText('`count`', { count: 3 }, {});
    expect(nodes[1].className).toBe('backtick-ref');
    expect([nodes[1].textContent, nodes[1].title]).toEqual(['`count`', '']);
}

function validateMissingReferenceStaysPlainText() {
    expect(collectAppendReferenceText('a `nope` b', {}, {}).length).toBe(1);
}

function validateMixedTextKeepsItsOrder() {
    const nodes = collectAppendReferenceText('x `a` y `missing` z `b`', { a: 'one' }, { b: 'two' });
    expect(nodes[0].textContent).toBe('x ');
    expect(nodes[2].textContent).toBe(' y `missing` z ');
    expect(nodes[3].textContent).toBe('`b`');
    expect(nodes.length).toBe(5);
}

function validateMouseEnterAddsOneTooltipAndMouseLeaveRemovesIt() {
    const nodes = collectAppendReferenceText('`a` `b`', { a: 'one', b: 'two' }, {});
    nodes[1].listeners.mouseenter();
    expect(getBodyChildren().length).toBe(1);
    expect(getBodyChildren()[0].className).toBe('backtick-tooltip');
    expect(getBodyChildren()[0].textContent).toBe("'one'");
    expect(getBodyChildren()[0].style).toEqual({ position: 'fixed', left: '10px', top: '20px' });
    nodes[3].listeners.mouseenter();
    expect(getBodyChildren().length).toBe(1);
    expect(getBodyChildren()[0].textContent).toBe("'two'");
    nodes[3].listeners.mouseleave();
    expect(getBodyChildren().length).toBe(0);
}

function registerReferenceTextTests() {
    afterEach(removeFakeDocument);
    test('test_found_reference_becomes_a_span_without_a_title', validateFoundReferenceBecomesASpanWithoutATitle);
    test('test_missing_reference_stays_plain_text', validateMissingReferenceStaysPlainText);
    test('test_mixed_text_keeps_its_order', validateMixedTextKeepsItsOrder);
    test('test_mouse_enter_adds_one_tooltip_and_mouse_leave_removes_it', validateMouseEnterAddsOneTooltipAndMouseLeaveRemovesIt);
}

describe('backtickTooltipReferenceText', registerReferenceTextTests);
