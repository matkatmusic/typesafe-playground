import { test, expect } from 'bun:test'
import { renderStateAndQuestionsBox } from './renderStateAndQuestionsBox'

function validateStateAndQuestionsBoxMarkup() {
    expect(renderStateAndQuestionsBox().toString()).toBe(
        '<div id="stateAndQuestionsBox">'
        + '<div id="stateJsonEditor"><div id="stateTitleRow"><span class="other-label">state</span>'
        + '<label id="batchToggle"><input type="checkbox" id="batchCheckbox"> batch</label>'
        + '<button class="format-json-button" id="stateUndoButton">Undo</button><button class="format-json-button" id="stateRedoButton">Redo</button>'
        + '<button class="format-json-button" id="stateFormatJsonButton">Format JSON</button></div></div>'
        + '<div class="row-resizer" id="rowResizer"></div>'
        + '<div id="questionsJsonEditor"><div id="questionsTitleRow"><span class="other-label">questions</span><div id="questionsAddQuestion"></div>'
        + '<button class="format-json-button" id="questionsUndoButton">Undo</button><button class="format-json-button" id="questionsRedoButton">Redo</button>'
        + '<button class="format-json-button" id="questionsFormatJsonButton">Format JSON</button></div></div>'
        + '</div>',
    )
}

test('test_state_and_questions_box_markup', validateStateAndQuestionsBoxMarkup)
