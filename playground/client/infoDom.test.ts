import { test, expect, afterEach } from 'bun:test';
import { addInfoRow, addPart, addParts, createBarInfoBox } from './infoDom';
import { pageState } from './state';

function createFakeElement() {
  const element = {
    className: '', textContent: '', title: '', children: [] as unknown[], listeners: {} as Record<string, () => void>,
    appendChild(child: unknown) { element.children.push(child); },
    addEventListener(type: string, listener: () => void) { element.listeners[type] = listener; },
  };
  return element;
}

function createFakeText(text: string) {
  const element = createFakeElement();
  element.textContent = text;
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
  addPart(parent as unknown as HTMLElement, 'hi', 'info-value', undefined);
  const span = parent.children[0] as FakeElement;
  expect(span.className).toBe('info-value');
  expect(span.textContent).toBe('hi');
  addParts(parent as unknown as HTMLElement, [['a', 'x'], ['b', 'y']], undefined);
  expect(parent.children.length).toBe(3);
}

function validateRowIsALabelThenACell() {
  installFakeDocument();
  const box = createFakeElement();
  addInfoRow(box as unknown as HTMLElement, { label: 'Score:', parts: [['0.5', 'info-value']] }, undefined);
  expect(box.children.length).toBe(2);
  expect((box.children[0] as FakeElement).textContent).toBe('Score:');
  expect((box.children[1] as FakeElement).className).toBe('info-cell');
  expect((box.children[1] as FakeElement).children.length).toBe(1);
}

function validateBoxHoldsTwoChildrenPerRow() {
  installFakeDocument();
  const box = createBarInfoBox([{ label: 'a', parts: [] }, { label: 'b', parts: [] }], undefined) as unknown as FakeElement;
  expect(box.className).toBe('bar-info');
  expect(box.children.length).toBe(4);
}

function validateMessagePartShowsTheReplacedTextInATooltip() {
  const version = { id: 1, time: '', state: { tone: 'calm' }, questions: {}, calls: 0, outputs: [] };
  Object.assign(globalThis, { document: { createElement: createFakeElement, createTextNode: createFakeText } });
  pageState.versions = [version];
  pageState.index = 0;
  const parent = createFakeElement();
  addPart(parent as unknown as HTMLElement, 'Be `tone`.', 'info-value info-message', undefined);
  pageState.versions = [];
  const span = parent.children[0] as FakeElement;
  const parts = span.children as FakeElement[];
  expect(parts.length).toBe(3);
  expect(parts[0].textContent).toBe('Be ');
  expect(parts[1].className).toBe('backtick-ref');
  expect(parts[1].textContent).toBe('`tone`');
  expect(parts[1].title).toBe('');
  expect(typeof parts[1].listeners.mouseenter).toBe('function');
  expect(typeof parts[1].listeners.mouseleave).toBe('function');
  expect(parts[2].textContent).toBe('.');
}

const OWN_NAME_QUESTION = { type: 'noul', instructions: { task: 'Is `secretWord` the word banana?', secretWord: 'banana' } } as const;
const CROSS_NAME_QUESTION = { type: 'noul', instructions: 'Is `secretWord` the word banana?' } as const;

function listMessageClasses(question: unknown): string[] {
  const version = { id: 1, time: '', state: { fruit: 'apple' }, questions: { ownName: OWN_NAME_QUESTION, crossName: CROSS_NAME_QUESTION }, calls: 0, outputs: [] };
  Object.assign(globalThis, { document: { createElement: createFakeElement, createTextNode: createFakeText } });
  pageState.versions = [version];
  pageState.index = 0;
  const parent = createFakeElement();
  addPart(parent as unknown as HTMLElement, 'Is `secretWord` the word banana?', 'info-value info-message', question);
  pageState.versions = [];
  const span = parent.children[0] as FakeElement;
  return (span.children as FakeElement[]).map((part) => part.className);
}

function validateCrossNameMessageGetsNoHoverTextFromAnotherQuestion() {
  // Step: the message belongs to crossName, which uses secretWord but does not declare it.
  const classes = listMessageClasses(CROSS_NAME_QUESTION);
  // Step: the message holds no hover-text span.
  expect(classes).not.toContain('backtick-ref');
}

function validateOwnNameMessageGetsHoverTextFromItsOwnQuestion() {
  // Step: the message belongs to ownName, which declares secretWord.
  const classes = listMessageClasses(OWN_NAME_QUESTION);
  // Step: the message holds a hover-text span.
  expect(classes).toContain('backtick-ref');
}

afterEach(removeFakeDocument);
test('test_cross_name_message_gets_no_hover_text_from_another_question', validateCrossNameMessageGetsNoHoverTextFromAnotherQuestion);
test('test_own_name_message_gets_hover_text_from_its_own_question', validateOwnNameMessageGetsHoverTextFromItsOwnQuestion);
test('test_message_part_shows_the_replaced_text_in_a_tooltip', validateMessagePartShowsTheReplacedTextInATooltip);
test('test_part_is_a_span_with_class_and_text', validatePartIsASpanWithClassAndText);
test('test_row_is_a_label_then_a_cell', validateRowIsALabelThenACell);
test('test_box_holds_two_children_per_row', validateBoxHoldsTwoChildrenPerRow);
