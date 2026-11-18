export type AttributeValue = string | number | boolean | null | undefined;
export type AttributeProps = Record<string, AttributeValue>;
export type HtmlChild = string | number | boolean | null | undefined | SafeHtml | HtmlChild[];

const VOID_ELEMENTS = new Set(['input', 'meta', 'link', 'br', 'img', 'hr']);
const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export class SafeHtml {
  readonly html: string;

  constructor(html: string) {
    this.html = html;
  }

  toString(): string {
    return this.html;
  }
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

function renderChild(child: HtmlChild): string {
  if (child === null)
    return '';
  if (child === undefined)
    return '';
  if (typeof child === 'boolean')
    return '';
  if (Array.isArray(child))
    return renderChildren(child);
  if (child instanceof SafeHtml)
    return child.html;
  return escapeHtml(String(child));
}

function renderChildren(children: HtmlChild[]): string {
  return children.map(renderChild).join('');
}

function renderAttribute(name: string, value: AttributeValue): string {
  if (value === true)
    return ` ${name}`;
  if (value === false)
    return '';
  if (value === null)
    return '';
  if (value === undefined)
    return '';
  return ` ${name}="${escapeHtml(String(value))}"`;
}

function renderAttributes(props: AttributeProps | null): string {
  if (props === null)
    return '';
  return Object.entries(props).map(([name, value]) => renderAttribute(name, value)).join('');
}

function renderElement<Props extends object>(tag: string | ((props: Props) => SafeHtml), props: Omit<Props, 'children'> | null, ...children: HtmlChild[]): SafeHtml {
  if (typeof tag === 'function')
    return tag({ ...props, children } as Props);
  const attributes = renderAttributes(props as AttributeProps | null);
  if (VOID_ELEMENTS.has(tag))
    return new SafeHtml(`<${tag}${attributes}>`);
  return new SafeHtml(`<${tag}${attributes}>${renderChildren(children)}</${tag}>`);
}

function renderFragment(props: { children?: HtmlChild[] }): SafeHtml {
  if (props.children === undefined)
    throw new Error('Fragment was called without children');
  return new SafeHtml(renderChildren(props.children));
}

function wrapRawHtml(text: string): SafeHtml {
  return new SafeHtml(text);
}

// The JSX settings in tsconfig.json name the factory `h` and the fragment factory `Fragment`.
export { renderElement as h, renderFragment as Fragment, wrapRawHtml as rawHtml };
