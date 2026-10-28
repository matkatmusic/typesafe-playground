import { test, expect, afterEach } from 'bun:test';
import { wrapVersionSections } from './reportSections';

class FakeElement {
  children: FakeElement[] = [];
  parent: FakeElement | null = null;
  textContent = '';
  tagName: string;
  constructor(tagName: string, textContent: string) {
    this.tagName = tagName;
    this.textContent = textContent;
  }
  appendChild(child: FakeElement) {
    if (child.parent !== null)
      child.parent.children.splice(child.parent.children.indexOf(child), 1);
    child.parent = this;
    this.children.push(child);
  }
  replaceChild(newChild: FakeElement, oldChild: FakeElement) {
    this.children[this.children.indexOf(oldChild)] = newChild;
    newChild.parent = this;
    oldChild.parent = null;
  }
}

function installFakeDocument() {
  Object.assign(globalThis, { document: { createElement: (tag: string) => new FakeElement(tag.toUpperCase(), '') } });
}

afterEach(() => Reflect.deleteProperty(globalThis, 'document'));

function buildBody(specs: string[]): FakeElement {
  const body = new FakeElement('DIV', '');
  for (const spec of specs) {
    const [tag, text] = spec.split(':');
    body.appendChild(new FakeElement(tag, text ?? ''));
  }
  return body;
}

function describeTree(element: FakeElement): string {
  const parts: string[] = [];
  for (const child of element.children) {
    const hasChildren = child.children.length > 0;
    const text = child.textContent === '' ? '' : `:${child.textContent}`;
    parts.push(hasChildren ? `${child.tagName}${text}(${describeTree(child)})` : `${child.tagName}${text}`);
  }
  return parts.join(' ');
}

function wrap(body: FakeElement) {
  installFakeDocument();
  wrapVersionSections(body as never);
}

function validateSectionsWrapTheirContent() {
  const body = buildBody(['H1:Notes report', 'H2:Version 2', 'P:a', 'H3:x', 'H2:Version 1', 'P:b']);
  wrap(body);
  expect(describeTree(body)).toBe('H1:Notes report DETAILS(SUMMARY:Version 2 P:a H3:x) DETAILS(SUMMARY:Version 1 P:b)');
}

function validateSectionsStartClosed() {
  const body = buildBody(['H2:Version 2', 'P:a', 'H2:Version 1']);
  wrap(body);
  for (const section of body.children)
    expect('open' in section).toBe(false);
}

function validateContentBeforeFirstHeadingStaysOutside() {
  const body = buildBody(['H1:Notes report', 'P:intro', 'H2:Version 1', 'P:a']);
  wrap(body);
  expect(describeTree(body)).toBe('H1:Notes report P:intro DETAILS(SUMMARY:Version 1 P:a)');
}

function validateDividersStayBetweenSections() {
  const body = buildBody(['H2:Version 2', 'P:a', 'HR', 'H2:Version 1', 'P:b']);
  wrap(body);
  expect(describeTree(body)).toBe('DETAILS(SUMMARY:Version 2 P:a) HR DETAILS(SUMMARY:Version 1 P:b)');
}

function validateDividerInsideANoteStaysInsideTheSection() {
  const body = buildBody(['H2:Version 1', 'P:a', 'HR', 'P:b']);
  wrap(body);
  expect(describeTree(body)).toBe('DETAILS(SUMMARY:Version 1 P:a HR P:b)');
}

test('test_sections_wrap_their_content', validateSectionsWrapTheirContent);
test('test_sections_start_closed', validateSectionsStartClosed);
test('test_content_before_first_heading_stays_outside', validateContentBeforeFirstHeadingStaysOutside);
test('test_dividers_stay_between_sections', validateDividersStayBetweenSections);
test('test_divider_inside_a_note_stays_inside_the_section', validateDividerInsideANoteStaysInsideTheSection);
