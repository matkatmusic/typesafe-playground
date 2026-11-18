import { test, expect } from 'bun:test'
import { Fragment, h, rawHtml } from './renderHtml'

function validateTextChildrenAreEscaped() {
    // Step: a text child holds all five special characters.
    const html = h('p', null, `<b> & " '`)
    // Step: each special character is replaced by its entity.
    expect(html.toString()).toBe('<p>&lt;b&gt; &amp; &quot; &#39;</p>')
}

function validateAttributeValuesAreEscaped() {
    // Step: an attribute value holds quote, angle bracket, ampersand and apostrophe.
    const html = h('a', { title: `a"b<c>&'d` })
    // Step: each special character is replaced by its entity.
    expect(html.toString()).toBe('<a title="a&quot;b&lt;c&gt;&amp;&#39;d"></a>')
}

function validateVoidElementsHaveNoClosingTag() {
    // Step: each void element is rendered with one attribute.
    expect(h('input', { id: 'x' }).toString()).toBe('<input id="x">')
    expect(h('meta', { charset: 'utf-8' }).toString()).toBe('<meta charset="utf-8">')
    expect(h('link', { id: 'x' }).toString()).toBe('<link id="x">')
    expect(h('br', null).toString()).toBe('<br>')
    expect(h('img', { id: 'x' }).toString()).toBe('<img id="x">')
    expect(h('hr', null).toString()).toBe('<hr>')
}

function validateEmptyNonVoidElementsKeepTheClosingTag() {
    expect(h('div', { id: 'x' }).toString()).toBe('<div id="x"></div>')
}

function validateTrueAttributePrintsTheNameOnly() {
    expect(h('input', { id: 'x', disabled: true }).toString()).toBe('<input id="x" disabled>')
}

function validateFalseNullAndUndefinedAttributesAreLeftOut() {
    // Step: three attributes that must not be printed, between two that must.
    const html = h('input', { id: 'x', disabled: false, hidden: null, title: undefined, type: 'text' })
    expect(html.toString()).toBe('<input id="x" type="text">')
}

function validateAttributesKeepTheOrderOfTheProps() {
    expect(h('input', { type: 'text', id: 'x', class: 'y' }).toString()).toBe('<input type="text" id="x" class="y">')
}

function validateNumberAttributesAndChildrenPrintAsText() {
    expect(h('input', { min: 1 }).toString()).toBe('<input min="1">')
    expect(h('span', null, 7).toString()).toBe('<span>7</span>')
}

function validateNullFalseAndUndefinedChildrenPrintNothing() {
    expect(h('span', null, null, false, undefined, 'a').toString()).toBe('<span>a</span>')
}

function validateArraysAndNestedChildrenFlatten() {
    // Step: an array holds an element and a nested array that holds another element.
    const items = [h('li', null, 'a'), [h('li', null, 'b'), 'c']]
    expect(h('ul', null, items).toString()).toBe('<ul><li>a</li><li>b</li>c</ul>')
}

function validateNestedElementsAreNotEscapedAgain() {
    expect(h('div', null, h('b', null, 'x')).toString()).toBe('<div><b>x</b></div>')
}

function validateRawHtmlIsNotEscaped() {
    expect(h('style', null, rawHtml('a > b { color: red }')).toString()).toBe('<style>a > b { color: red }</style>')
}

function validateFunctionTagIsCalledWithPropsAndChildren() {
    // Step: a component builds a div from its props and its children.
    function renderBox(props: { id: string; children: unknown[] }) {
        return h('div', { id: props.id }, props.children as string[])
    }
    expect(h(renderBox, { id: 'box' }, 'a', 'b').toString()).toBe('<div id="box">ab</div>')
}

function validateFragmentPrintsItsChildrenOnly() {
    expect(h(Fragment, null, h('b', null, 'x'), 'y').toString()).toBe('<b>x</b>y')
}

function validateJsxSyntaxRendersThroughTheFactory() {
    // Step: the same markup written as JSX and as plain h calls.
    const jsx = <label for="a" class="b">Name<input id="a" disabled /></label>
    expect(jsx.toString()).toBe('<label for="a" class="b">Name<input id="a" disabled></label>')
}

function validateJsxFragmentRendersThroughTheFactory() {
    const jsx = <><b>x</b><i>y</i></>
    expect(jsx.toString()).toBe('<b>x</b><i>y</i>')
}

test('test_text_children_are_escaped', validateTextChildrenAreEscaped)
test('test_attribute_values_are_escaped', validateAttributeValuesAreEscaped)
test('test_void_elements_have_no_closing_tag', validateVoidElementsHaveNoClosingTag)
test('test_empty_non_void_elements_keep_the_closing_tag', validateEmptyNonVoidElementsKeepTheClosingTag)
test('test_true_attribute_prints_the_name_only', validateTrueAttributePrintsTheNameOnly)
test('test_false_null_and_undefined_attributes_are_left_out', validateFalseNullAndUndefinedAttributesAreLeftOut)
test('test_attributes_keep_the_order_of_the_props', validateAttributesKeepTheOrderOfTheProps)
test('test_number_attributes_and_children_print_as_text', validateNumberAttributesAndChildrenPrintAsText)
test('test_null_false_and_undefined_children_print_nothing', validateNullFalseAndUndefinedChildrenPrintNothing)
test('test_arrays_and_nested_children_flatten', validateArraysAndNestedChildrenFlatten)
test('test_nested_elements_are_not_escaped_again', validateNestedElementsAreNotEscapedAgain)
test('test_raw_html_is_not_escaped', validateRawHtmlIsNotEscaped)
test('test_function_tag_is_called_with_props_and_children', validateFunctionTagIsCalledWithPropsAndChildren)
test('test_fragment_prints_its_children_only', validateFragmentPrintsItsChildrenOnly)
test('test_jsx_syntax_renders_through_the_factory', validateJsxSyntaxRendersThroughTheFactory)
test('test_jsx_fragment_renders_through_the_factory', validateJsxFragmentRendersThroughTheFactory)
