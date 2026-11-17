import { HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

export const jsonHighlight = HighlightStyle.define([
  { tag: tags.string, color: 'var(--tok-string)' },
  { tag: tags.number, color: 'var(--tok-number)' },
  { tag: tags.propertyName, color: 'var(--tok-key)' },
  { tag: [tags.bool, tags.null], color: 'var(--tok-atom)' },
  { tag: [tags.punctuation, tags.brace, tags.squareBracket, tags.separator], color: 'var(--tok-punct)' },
]);
