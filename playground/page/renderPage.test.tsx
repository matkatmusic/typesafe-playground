import { test, expect } from 'bun:test'
import { renderDialogs } from './renderDialogs'
import { renderHeaderRow } from './renderHeaderRow'
import { renderInputBox } from './renderInputBox'
import { renderPage } from './renderPage'
import { renderResultBox } from './renderResultBox'
import { renderVersionBox } from './renderVersionBox'

const PAGE_PROPS = { css: 'a > b {}', script: 'if (a < b && c > d) {}', dataJson: '{"a":"\\u003c"}' }

function validatePageHoldsItsRegionsInOrder() {
    // Step: the page body holds the dialogs, the header, the version box, and the input and result boxes, in this order.
    const html = renderPage(PAGE_PROPS).toString()
    const regionMarkups = [
        renderDialogs().toString(),
        renderHeaderRow().toString(),
        renderVersionBox().toString(),
        '<div id="inputResultsBox">' + renderInputBox().toString() + '<div class="column-resizer" id="columnResizer"></div>' + renderResultBox().toString() + '</div>',
    ]
    expect(html.includes('<body id="playgroundComponentBox">' + regionMarkups.join(''))).toBe(true)
}

function validatePageStartsWithTheHtmlTagAndEndsWithTheScripts() {
    const html = renderPage(PAGE_PROPS).toString()
    expect(html.startsWith('<html lang="en"><head>')).toBe(true)
    expect(html.endsWith('<script type="application/json" id="data">{"a":"\\u003c"}</script><script type="module">if (a < b && c > d) {}</script></body></html>')).toBe(true)
}

test('test_page_holds_its_regions_in_order', validatePageHoldsItsRegionsInOrder)
test('test_page_starts_with_the_html_tag_and_ends_with_the_scripts', validatePageStartsWithTheHtmlTagAndEndsWithTheScripts)
