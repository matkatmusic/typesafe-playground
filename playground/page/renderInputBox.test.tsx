import { test, expect } from 'bun:test'
import { renderCostTokenSubmitBox, renderErrorLine, renderInputBox } from './renderInputBox'
import { renderStateAndQuestionsBox } from './renderStateAndQuestionsBox'

function validateCostTokenSubmitBoxMarkup() {
    expect(renderCostTokenSubmitBox().toString()).toBe(
        '<div id="costTokenSubmitBox"><span id="costLabel">Cost: $0.000000</span><span id="tokensLabel">Tokens: 0</span>'
        + '<div id="callsSubmitGroup"><label id="callsLabel" for="callsPicker">Calls</label>'
        + '<input id="callsPicker" type="number" min="1" max="10" step="1" value="1" title="Calls per submit">'
        + '<button id="submitButton">Submit (paid)</button></div></div>',
    )
}

function validateErrorLineMarkup() {
    expect(renderErrorLine().toString()).toBe('<div id="errorLine"></div>')
}

function validateInputBoxHoldsItsThreePartsInOrder() {
    expect(renderInputBox().toString()).toBe(
        '<div id="inputBox">' + renderCostTokenSubmitBox().toString() + renderErrorLine().toString() + renderStateAndQuestionsBox().toString() + '</div>',
    )
}

test('test_cost_token_submit_box_markup', validateCostTokenSubmitBoxMarkup)
test('test_error_line_markup', validateErrorLineMarkup)
test('test_input_box_holds_its_three_parts_in_order', validateInputBoxHoldsItsThreePartsInOrder)
