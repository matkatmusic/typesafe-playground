import { test, expect } from 'bun:test';
import { Fragment, h, rawHtml } from './renderHtml';

function validateRawHtmlIsNotEscaped() {
    // Step: raw html holds angle brackets.
    const html = rawHtml('<b>&</b>');
    // Step: the text is kept as written.
    expect(html.toString()).toBe('<b>&</b>');
}

function validateFragmentJoinsChildrenWithoutWrapper() {
    // Step: a fragment holds a text child, a nested array and ignored values.
    const html = Fragment({ children: ['a', ['b', 1], null, undefined, false] });
    // Step: the children are joined with no wrapper tag.
    expect(html.toString()).toBe('ab1');
}

function validateFragmentWithoutChildrenThrows() {
    // Step: a fragment is called with no children.
    function executeFragmentWithoutChildren() {
        Fragment({});
    }
    // Step: the call throws.
    expect(executeFragmentWithoutChildren).toThrow('Fragment was called without children');
}

function validateBooleanAndNullAttributes() {
    // Step: attributes hold true, false, null and undefined.
    const html = h('input', { disabled: true, hidden: false, a: null, b: undefined, id: 'x' });
    // Step: only true and the string value are rendered.
    expect(html.toString()).toBe('<input disabled id="x">');
}

function validateFunctionComponentReceivesChildren() {
    // Step: a function component wraps its children in a div.
    function renderBox(props: { children: string[] }) {
        return h('div', null, ...props.children);
    }
    const html = h(renderBox, null, 'x');
    // Step: the component output is returned.
    expect(html.toString()).toBe('<div>x</div>');
}

test('test_raw_html_is_not_escaped', validateRawHtmlIsNotEscaped);
test('test_fragment_joins_children_without_wrapper', validateFragmentJoinsChildrenWithoutWrapper);
test('test_fragment_without_children_throws', validateFragmentWithoutChildrenThrows);
test('test_boolean_and_null_attributes', validateBooleanAndNullAttributes);
test('test_function_component_receives_children', validateFunctionComponentReceivesChildren);
