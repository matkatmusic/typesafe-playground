export type AttributeValue = string | number | boolean | null | undefined;
export type AttributeProps = Record<string, AttributeValue>;
export type HtmlChild = string | number | boolean | null | undefined | SafeHtml | HtmlChild[];

export class SafeHtml {
    public readonly html: string;

    public constructor(html: string) {
        this.html = html;
    }

    public toString(): string {
        return this.html;
    }
}

function replaceHtmlSpecialCharacters(text: string): string {
    const htmlEscapes: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    function getHtmlEscape(character: string): string {
        return htmlEscapes[character];
    }
    return text.replace(/[&<>"']/g, getHtmlEscape);
}

function renderChild(child: HtmlChild): string {
    if (child === null)
        return '';
    if (child === undefined)
        return '';
    if (typeof child === 'boolean')
        return '';
    const childIsArray = Array.isArray(child);
    if (childIsArray)
        return renderChildren(child);
    if (child instanceof SafeHtml)
        return child.html;
    return replaceHtmlSpecialCharacters(String(child));
}

function renderChildren(children: HtmlChild[]): string {
    const renderedChildren: string[] = [];
    for (const child of children) {
        renderedChildren.push(renderChild(child));
    }
    return renderedChildren.join('');
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
    return ` ${name}="${replaceHtmlSpecialCharacters(String(value))}"`;
}

function renderAttributes(props: AttributeProps | null): string {
    if (props === null)
        return '';
    const propEntries = Object.entries(props);
    const renderedAttributes: string[] = [];
    for (const [name, value] of propEntries) {
        renderedAttributes.push(renderAttribute(name, value));
    }
    return renderedAttributes.join('');
}

function renderElement<Props extends object>(tag: string | ((props: Props) => SafeHtml), props: Omit<Props, 'children'> | null, ...children: HtmlChild[]): SafeHtml {
    if (typeof tag === 'function')
        return tag({ ...props, children } as Props);
    const attributes = renderAttributes(props as AttributeProps | null);
    const voidElements = new Set(['input', 'meta', 'link', 'br', 'img', 'hr']);
    const tagIsVoidElement = voidElements.has(tag);
    if (tagIsVoidElement)
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
