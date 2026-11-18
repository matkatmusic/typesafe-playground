import { test, expect } from 'bun:test'
import { renderDocumentHead } from './renderDocumentHead'

function validateDocumentHeadMarkup() {
    expect(renderDocumentHead({ css: 'a > b { color: red }' }).toString()).toBe(
        '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        + '<title>Playground - Untitled</title><style>a > b { color: red }</style></head>',
    )
}

test('test_document_head_markup_holds_the_css_unescaped', validateDocumentHeadMarkup)
