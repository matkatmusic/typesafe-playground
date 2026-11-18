import { test, expect } from 'bun:test'
import { renderHeaderRow, renderProviderSwitch } from './renderHeaderRow'

function validateProviderSwitchMarkup() {
    expect(renderProviderSwitch().toString()).toBe(
        '<span id="providerSwitchBox"><span id="providerTypeSafeLabel">TypeSafe</span>'
        + '<input id="providerSwitch" type="checkbox" role="switch" disabled aria-label="provider">'
        + '<span id="providerSubqLabel">SubQ</span></span>',
    )
}

function validateHeaderRowMarkup() {
    expect(renderHeaderRow().toString()).toBe(
        '<div id="headerBox"><button id="newButton">New</button><button id="openButton">Open</button><button id="saveButton">Save</button>'
        + '<button id="resetButton">Reset</button><button id="reportButton">Report</button><button id="copyPathButton">copy path</button>'
        + renderProviderSwitch().toString()
        + '<label id="typeSafeKeyLabel" for="typeSafeKeyEditor">TypeSafe API key</label>'
        + '<input id="typeSafeKeyEditor" type="password" autocomplete="off" spellcheck="false" placeholder="TypeSafe API key">'
        + '<button id="showKeyButton">Show</button><span id="totalCostLabel">total cost: $0.000000</span><span id="lastEditedLabel"></span>'
        + '<button id="lightDarkModeButton">light</button></div>',
    )
}

test('test_provider_switch_markup', validateProviderSwitchMarkup)
test('test_header_row_markup', validateHeaderRowMarkup)
