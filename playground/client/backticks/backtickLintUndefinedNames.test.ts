import { test, expect } from 'bun:test';
import type { EditorView } from '@codemirror/view';
import { buildUndefinedNameSource } from './backtickLint';
import { pageState } from '../page/state';
import { collectQuestionsEditorDiagnostics, createJsonState, createQuestionsState, getFruitState, getScopeQuestions } from './backtickLintSupport';

function validateUndefinedBacktickedNamesGetErrorDiagnostics() {
    // Updated: names must point to text now, and messages come from the shared library.
    const text = '{"x": "`mood` `nope` `q.b` `q.z`"}';
    const diagnostics = collectQuestionsEditorDiagnostics('{"mood": "calm", "q": {"b": "two"}}', text);
    const nopeFrom = text.indexOf('nope');
    const zFrom = text.indexOf('q.z');
    expect(diagnostics).toEqual([
        { from: nopeFrom, to: nopeFrom + 4, severity: 'error', message: '`nope` is not in state or in this question' },
        { from: zFrom, to: zFrom + 3, severity: 'error', message: '`q.z` is not in state or in this question' },
    ]);
}

function validateNameFromAnotherQuestionGetsAnError() {
    // Step: ownName declares secretWord, crossName uses it without declaring it, stateName uses a state name.
    const scopeQuestions = getScopeQuestions();
    const diagnostics = collectQuestionsEditorDiagnostics(getFruitState(), scopeQuestions);
    // Step: only crossName's secretWord is wrong, because a question cannot read another question.
    const nameFrom = scopeQuestions.indexOf('`secretWord`', scopeQuestions.indexOf('"crossName"')) + 1;
    expect(diagnostics).toEqual([
        { from: nameFrom, to: nameFrom + 'secretWord'.length, severity: 'error', message: '`secretWord` is not in state or in this question' },
    ]);
}

function validateBatchItemWithoutTheNameGetsAnError() {
    // Step: batch is on and the second state item has no fruit.
    pageState.isBatchOn = true;
    const questionsText = '{"stateName":{"type":"noul","instructions":"Is `fruit` the word apple?"}}';
    const diagnostics = collectQuestionsEditorDiagnostics('[{"fruit": "apple"}, {"other": "pear"}]', questionsText);
    // Step: fruit is wrong, because one batch item cannot resolve it.
    pageState.isBatchOn = false;
    const nameFrom = questionsText.indexOf('`fruit`') + 1;
    expect(diagnostics).toEqual([
        { from: nameFrom, to: nameFrom + 'fruit'.length, severity: 'error', message: '`fruit` is not in state or in this question' },
    ]);
}

function validateStateEditorNamesResolveFromTheStateOnly() {
    // Step: the state uses secretWord, which only a question declares.
    const stateText = '{"fruit": "apple", "note": "`secretWord`"}';
    const stateState = createJsonState(stateText);
    function getEditorStates() {
        return [stateState, createQuestionsState(getScopeQuestions())];
    }
    const source = buildUndefinedNameSource(getEditorStates);
    const diagnostics = source({ state: stateState } as unknown as EditorView);
    // Step: the state editor does not read questions, so secretWord is wrong.
    const nameFrom = stateText.indexOf('secretWord');
    expect(diagnostics).toEqual([
        { from: nameFrom, to: nameFrom + 'secretWord'.length, severity: 'error', message: '`secretWord` is not in state or in this question' },
    ]);
}

test('test_name_from_another_question_gets_an_error', validateNameFromAnotherQuestionGetsAnError);
test('test_batch_item_without_the_name_gets_an_error', validateBatchItemWithoutTheNameGetsAnError);
test('test_state_editor_names_resolve_from_the_state_only', validateStateEditorNamesResolveFromTheStateOnly);
test('test_undefined_backticked_names_get_error_diagnostics', validateUndefinedBacktickedNamesGetErrorDiagnostics);
