import { test, expect } from 'bun:test';
import { graphState } from '../graphs/graphState';
import { pageState } from '../page/state';
import { FakeElement, getLowNoulVersion, getNoulVersion, listByName, removeFakeDocument, renderNoulBlock } from './infoBoxFakeDom';

function validateAppendChildAddsToChildren() {
    // Append a child to a fake element, then check the child is listed.
    const parent = new FakeElement();
    const child = new FakeElement();
    parent.appendChild(child);
    expect(parent.children).toEqual([child]);
}

function validateReplaceChildrenDropsOldChildren() {
    // Replace the children, then check only the new child stays.
    const parent = new FakeElement();
    parent.appendChild(new FakeElement());
    const replacement = new FakeElement();
    parent.replaceChildren(replacement);
    expect(parent.children).toEqual([replacement]);
}

function validateSetAndRemoveAttribute() {
    // Set an attribute, check it, remove it, check it is gone.
    const element = new FakeElement();
    element.setAttribute('fill', 'red');
    expect(element.attrs.fill).toBe('red');
    element.removeAttribute('fill');
    expect(element.attrs.fill).toBeUndefined();
}

function validateQuerySelectorFindsChildByClassName() {
    // Add one child with a class name, then find it with a dot selector.
    const parent = new FakeElement();
    const child = new FakeElement();
    child.className = 'target';
    parent.appendChild(child);
    expect(parent.querySelector('.target')).toBe(child);
    expect(parent.querySelector('.missing')).toBeNull();
}

function validateRemoveMarksElementRemoved() {
    // Remove an element, then check its name says removed.
    const element = new FakeElement();
    element.remove();
    expect(element.name).toBe('removed');
}

function validateListByNameKeepsOnlyMatchingNodes() {
    // Build two nodes with different names, then filter by one name.
    const rect = new FakeElement();
    rect.name = 'rect';
    const circle = new FakeElement();
    circle.name = 'circle';
    expect(listByName([rect, circle], 'rect')).toEqual([rect]);
}

function validateNoulVersionsHaveDifferentNoulValues() {
    // Read the noul value of the normal and the low version.
    const normalAnswer = getNoulVersion().outputs[0].answers.q;
    const lowAnswer = getLowNoulVersion().outputs[0].answers.q;
    expect(normalAnswer).toEqual({ type: 'noul', noul: 0.8 });
    expect(lowAnswer).toEqual({ type: 'noul', noul: 0.07 });
}

function validateRenderNoulBlockReturnsAFirstChild() {
    // Render the block, check the page state holds the version, then clean up.
    const block = renderNoulBlock();
    expect(block).toBeInstanceOf(FakeElement);
    expect(pageState.versions.length).toBe(1);
    removeFakeDocument();
}

function validateRemoveFakeDocumentResetsState() {
    // Render a block, remove the fake document, check the state is reset.
    graphState.averageShownByName.q = true;
    renderNoulBlock();
    removeFakeDocument();
    expect('document' in globalThis).toBe(false);
    expect(graphState.averageShownByName).toEqual({});
    expect(pageState.versions).toEqual([]);
}

test('test_append_child_adds_to_children', validateAppendChildAddsToChildren);
test('test_replace_children_drops_old_children', validateReplaceChildrenDropsOldChildren);
test('test_set_and_remove_attribute', validateSetAndRemoveAttribute);
test('test_query_selector_finds_child_by_class_name', validateQuerySelectorFindsChildByClassName);
test('test_remove_marks_element_removed', validateRemoveMarksElementRemoved);
test('test_list_by_name_keeps_only_matching_nodes', validateListByNameKeepsOnlyMatchingNodes);
test('test_noul_versions_have_different_noul_values', validateNoulVersionsHaveDifferentNoulValues);
test('test_render_noul_block_returns_a_first_child', validateRenderNoulBlockReturnsAFirstChild);
test('test_remove_fake_document_resets_state', validateRemoveFakeDocumentResetsState);
