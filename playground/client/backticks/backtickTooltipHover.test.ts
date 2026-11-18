import { test, expect } from 'bun:test';
import { json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { getQuestionsEditorFacet } from '../questions/questionNames';
import { buildBacktickHoverSource, findReferenceTooltipText } from './backtickTooltip';
import {
    type FakeNode, getQuestionsText, getStateText, createJsonState, createSource, createView, installFakeDocument, removeFakeDocument,
} from './backtickTooltipFakeDom';

function validateStateWinsOverQuestions() {
    expect(findReferenceTooltipText('a', { a: 'state' }, { a: 'questions' })).toBe("'state'");
    expect(findReferenceTooltipText('b', { a: 'state' }, { b: 'questions' })).toBe("'questions'");
    expect(findReferenceTooltipText('a[1]', { a: ['p', 'q'] }, {})).toBe("'q'");
    expect(findReferenceTooltipText('nope', { a: 1 }, { b: 2 })).toBe(null);
}

function validateHoverInsideNameGivesTooltipOnTheName() {
    installFakeDocument();
    const nameFrom = getQuestionsText().indexOf('message.text');
    const tooltip = createSource(getStateText(), getQuestionsText())(createView(getQuestionsText()), nameFrom + 3);
    expect(tooltip?.pos).toBe(nameFrom);
    expect(tooltip?.end).toBe(nameFrom + 'message.text'.length);
    expect(tooltip?.above).toBe(true);
    const dom = tooltip?.create({} as EditorView).dom as unknown as FakeNode;
    expect(dom.className).toBe('backtick-tooltip');
    expect(dom.textContent).toBe("'Hello'");
    removeFakeDocument();
}

function validateHoverOutsideBackticksGivesNull() {
    expect(createSource(getStateText(), getQuestionsText())(createView(getQuestionsText()), getQuestionsText().indexOf('Plain') + 2)).toBe(null);
}

function validateHoverOnUnknownNameGivesNull() {
    expect(createSource(getStateText(), getQuestionsText())(createView(getQuestionsText()), getQuestionsText().indexOf('nope') + 1)).toBe(null);
}

function validateHoverGivesNullWhenAnEditorHasInvalidJson() {
    const nameFrom = getQuestionsText().indexOf('message.text');
    expect(createSource('{"message": ', getQuestionsText())(createView(getQuestionsText()), nameFrom + 3)).toBe(null);
    expect(createSource(getStateText(), 'Does `message.text` ask?')(createView('Does `message.text` ask?'), 10)).toBe(null);
}

function validateHoverOnArrayIndexNameGivesTooltipOnTheWholeName() {
    const questionsText = '{"q": "`userMessageArray[1]`"}';
    const source = createSource('{"userMessageArray": ["a", "b"]}', questionsText);
    const nameFrom = questionsText.indexOf('userMessageArray[1]');
    const tooltip = source(createView(questionsText), nameFrom + 3);
    expect(tooltip?.pos).toBe(nameFrom);
    expect(tooltip?.end).toBe(nameFrom + 'userMessageArray[1]'.length);
}

function getScopeQuestions(): string {
    return '{"ownName":{"type":"noul","instructions":{"task":"Is `secretWord` the word banana?","secretWord":"banana"}},"crossName":{"type":"noul","instructions":"Is `secretWord` the word banana?"},"stateName":{"type":"noul","instructions":"Is `fruit` the word apple?"}}';
}

function createQuestionsState(text: string): EditorState {
    return EditorState.create({ doc: text, extensions: [json(), getQuestionsEditorFacet().of(true)] });
}

function getHoverInQuestionsEditor(pos: number) {
    const questionsState = createQuestionsState(getScopeQuestions());
    function getEditorStates() {
        return [createJsonState('{"fruit": "apple"}'), questionsState];
    }
    const source = buildBacktickHoverSource(getEditorStates);
    return source({ state: questionsState } as unknown as EditorView, pos);
}

function validateHoverInOwnNameShowsItsOwnValue() {
    installFakeDocument();
    // Step: hover secretWord inside ownName, which declares it.
    const tooltip = getHoverInQuestionsEditor(getScopeQuestions().indexOf('`secretWord`') + 2);
    // Step: the tooltip shows ownName's value.
    const dom = tooltip?.create({} as EditorView).dom as unknown as FakeNode;
    expect(dom.textContent).toBe("'banana'");
    removeFakeDocument();
}

function validateHoverInCrossNameShowsNothing() {
    // Step: hover secretWord inside crossName, which does not declare it.
    const scopeQuestions = getScopeQuestions();
    const pos = scopeQuestions.indexOf('`secretWord`', scopeQuestions.indexOf('"crossName"')) + 2;
    // Step: another question's value is not shown.
    expect(getHoverInQuestionsEditor(pos)).toBe(null);
}

test('test_hover_in_own_name_shows_its_own_value', validateHoverInOwnNameShowsItsOwnValue);
test('test_hover_in_cross_name_shows_nothing', validateHoverInCrossNameShowsNothing);
test('test_state_wins_over_questions_and_array_index_and_unknown_name', validateStateWinsOverQuestions);
test('test_hover_inside_name_gives_tooltip_on_the_name', validateHoverInsideNameGivesTooltipOnTheName);
test('test_hover_outside_backticks_gives_null', validateHoverOutsideBackticksGivesNull);
test('test_hover_on_unknown_name_gives_null', validateHoverOnUnknownNameGivesNull);
test('test_hover_gives_null_when_an_editor_has_invalid_json', validateHoverGivesNullWhenAnEditorHasInvalidJson);
test('test_hover_on_array_index_name_gives_tooltip_on_the_whole_name', validateHoverOnArrayIndexNameGivesTooltipOnTheWholeName);
