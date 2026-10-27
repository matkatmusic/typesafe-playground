import { test, expect, afterEach } from 'bun:test';
import { addInfoRow, addPart, addParts, createBarInfoBox } from './infoDom';

function createFakeElement() {
  const element = {
    className: '', textContent: '', children: [] as unknown[],
    appendChild(child: unknown) { element.children.push(child); },
  };
  return element;
}

type FakeElement = ReturnType<typeof createFakeElement>;

function removeFakeDocument() {
  Reflect.deleteProperty(globalThis, 'document');
}

function installFakeDocument() {
  Object.assign(globalThis, { document: { createElement: createFakeElement } });
}

function validatePartIsASpanWithClassAndText() {
  installFakeDocument();
  const parent = createFakeElement();
  addPart(parent as unknown as HTMLElement, 'hi', 'info-value');
  const span = parent.children[0] as FakeElement;
  expect(span.className).toBe('info-value');
  expect(span.textContent).toBe('hi');
  addParts(parent as unknown as HTMLElement, [['a', 'x'], ['b', 'y']]);
  expect(parent.children.length).toBe(3);
}

function validateRowIsALabelThenACell() {
  installFakeDocument();
  const box = createFakeElement();
  addInfoRow(box as unknown as HTMLElement, { label: 'Score:', parts: [['0.5', 'info-value']] });
  expect(box.children.length).toBe(2);
  expect((box.children[0] as FakeElement).textContent).toBe('Score:');
  expect((box.children[1] as FakeElement).className).toBe('info-cell');
  expect((box.children[1] as FakeElement).children.length).toBe(1);
}

function validateBoxHoldsTwoChildrenPerRow() {
  installFakeDocument();
  const box = createBarInfoBox([{ label: 'a', parts: [] }, { label: 'b', parts: [] }]) as unknown as FakeElement;
  expect(box.className).toBe('bar-info');
  expect(box.children.length).toBe(4);
}

afterEach(removeFakeDocument);
test('test_part_is_a_span_with_class_and_text', validatePartIsASpanWithClassAndText);
test('test_row_is_a_label_then_a_cell', validateRowIsALabelThenACell);
test('test_box_holds_two_children_per_row', validateBoxHoldsTwoChildrenPerRow);
