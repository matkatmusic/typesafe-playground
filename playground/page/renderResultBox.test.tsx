import { test, expect } from 'bun:test'
import { renderResultBox } from './renderResultBox'

function validateResultBoxMarkup() {
    expect(renderResultBox().toString()).toBe(
        '<div id="resultBox"><div id="pinBox"><button id="pinButton">Pin</button><button id="unpinButton">Unpin</button><span id="pinInfo"></span></div>'
        + '<div id="winnerBox"></div>'
        + '<div id="graphButtonRow"><label id="replaceReferencesToggle"><input type="checkbox" id="replaceReferencesCheckbox"> replace references</label>'
        + '<button id="collapseAllButton">Collapse all</button><button id="expandAllButton">Expand all</button>'
        + '<button id="jsonToggleButton" aria-label="show response" title="show response">{ }</button></div>'
        + '<div id="graphContainerBox"></div><div id="resultJsonEditor" hidden></div></div>',
    )
}

test('test_result_box_markup', validateResultBoxMarkup)
