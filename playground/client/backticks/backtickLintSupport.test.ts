import { test, expect } from 'bun:test';
import { getQuestionsEditorFacet } from '../questions/questionNames';
import { collectQuestionsEditorDiagnostics, createJsonState, createQuestionsState, getFruitState, getScopeQuestions } from './backtickLintSupport';

function validateFruitStateIsJsonWithAnApple() {
    // Step: parse the fruit state text.
    const parsedFruitState = JSON.parse(getFruitState());
    // Step: it holds one fruit, apple.
    expect(parsedFruitState).toEqual({ fruit: 'apple' });
}

function validateScopeQuestionsHoldThreeQuestions() {
    // Step: parse the scope questions text.
    const parsedScopeQuestions = JSON.parse(getScopeQuestions());
    // Step: it holds the three questions the scope tests use.
    expect(Object.keys(parsedScopeQuestions)).toEqual(['ownName', 'crossName', 'stateName']);
}

function validateJsonStateHoldsTheGivenText() {
    // Step: build a state from some text.
    const state = createJsonState('{"a": 1}');
    // Step: the state document is that text.
    expect(state.doc.toString()).toBe('{"a": 1}');
}

function validateJsonStateIsNotAQuestionsEditor() {
    // Step: build a plain state.
    const state = createJsonState('{}');
    // Step: the questions facet is off.
    expect(state.facet(getQuestionsEditorFacet())).toBe(false);
}

function validateQuestionsStateIsAQuestionsEditor() {
    // Step: build a questions state.
    const state = createQuestionsState('{}');
    // Step: the questions facet is on.
    expect(state.facet(getQuestionsEditorFacet())).toBe(true);
}

function validateNoDiagnosticsWhenEveryNameIsInTheState() {
    // Step: the question uses only the name fruit, and the state has it.
    const diagnostics = collectQuestionsEditorDiagnostics(getFruitState(), '{"stateName":{"type":"noul","instructions":"Is `fruit` the word apple?"}}');
    // Step: there is no error.
    expect(diagnostics).toEqual([]);
}

function validateUnknownNameGetsOneDiagnostic() {
    // Step: the question uses the name nope, and the state does not have it.
    const questionsText = '{"q":{"type":"noul","instructions":"Is `nope` here?"}}';
    const diagnostics = collectQuestionsEditorDiagnostics(getFruitState(), questionsText);
    // Step: one error covers the name.
    const nameFrom = questionsText.indexOf('nope');
    expect(diagnostics).toEqual([
        { from: nameFrom, to: nameFrom + 4, severity: 'error', message: '`nope` is not in state or in this question' },
    ]);
}

test('test_fruit_state_is_json_with_an_apple', validateFruitStateIsJsonWithAnApple);
test('test_scope_questions_hold_three_questions', validateScopeQuestionsHoldThreeQuestions);
test('test_json_state_holds_the_given_text', validateJsonStateHoldsTheGivenText);
test('test_json_state_is_not_a_questions_editor', validateJsonStateIsNotAQuestionsEditor);
test('test_questions_state_is_a_questions_editor', validateQuestionsStateIsAQuestionsEditor);
test('test_no_diagnostics_when_every_name_is_in_the_state', validateNoDiagnosticsWhenEveryNameIsInTheState);
test('test_unknown_name_gets_one_diagnostic', validateUnknownNameGetsOneDiagnostic);
