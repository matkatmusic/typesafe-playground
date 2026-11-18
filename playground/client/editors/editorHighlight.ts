import { HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

class JsonHighlightHolder {
    private static instance: JsonHighlightHolder | undefined;
    public readonly jsonHighlight = HighlightStyle.define([
        { tag: tags.string, color: 'var(--tok-string)' },
        { tag: tags.number, color: 'var(--tok-number)' },
        { tag: tags.propertyName, color: 'var(--tok-key)' },
        { tag: [tags.bool, tags.null], color: 'var(--tok-atom)' },
        { tag: [tags.punctuation, tags.brace, tags.squareBracket, tags.separator], color: 'var(--tok-punct)' },
    ]);
    private constructor() {}
    public static getInstance() {
        JsonHighlightHolder.instance ??= new JsonHighlightHolder();
        return JsonHighlightHolder.instance;
    }
}

export function getJsonHighlight() {
    return JsonHighlightHolder.getInstance().jsonHighlight;
}
