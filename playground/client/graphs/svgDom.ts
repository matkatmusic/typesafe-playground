import type { SvgAttributes } from './graphTypes';


export function createSvgNode(name: string, attrs: SvgAttributes, text?: string): SVGElement {
    const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
    const node = document.createElementNS(SVG_NAMESPACE, name);
    for (const key in attrs)
        node.setAttribute(key, String(attrs[key]));
    if (text !== undefined)
        node.textContent = text;
    return node;
}
