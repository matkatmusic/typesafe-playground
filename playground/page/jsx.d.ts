import type { HtmlChild, SafeHtml } from './renderHtml';

type HtmlAttributes = {
  id?: string;
  class?: string;
  type?: string;
  for?: string;
  title?: string;
  placeholder?: string;
  autocomplete?: string;
  spellcheck?: string;
  disabled?: boolean;
  hidden?: boolean;
  readonly?: boolean;
  checked?: boolean;
  role?: string;
  value?: string | number;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  wrap?: string;
  name?: string;
  lang?: string;
  charset?: string;
  content?: string;
  method?: string;
  children?: HtmlChild;
  [attribute: `aria-${string}`]: string;
  [attribute: `data-${string}`]: string;
};

declare global {
  namespace JSX {
    type Element = SafeHtml;
    type IntrinsicElements = { [Tag in keyof HTMLElementTagNameMap]: HtmlAttributes };
    interface ElementChildrenAttribute {
      children: unknown;
    }
  }
}
