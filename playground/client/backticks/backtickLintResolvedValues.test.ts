import { test, expect } from 'bun:test';
import { collectQuestionsEditorDiagnostics, getFruitState } from './backtickLintSupport';

function validateNamePointingToBacktickedTextGetsNoError() {
    // Step: banana is declared in the question, and its text holds another backticked name.
    const questionsText = '{"scopeDeclarationInInstructions":{"type":"choice","instructions":{"question":"is `fruit` the same word as `banana`?","banana":"`fruit`"},"criteria":{"Yes":"yes they are the same word","no":"no they are different words","something else":"cannot determine"}}}';
    const diagnostics = collectQuestionsEditorDiagnostics(getFruitState(), questionsText);
    // Step: no name is wrong, because backticks inside values are not checked.
    expect(diagnostics).toEqual([]);
}

function validateBacktickedValuesInChoiceCriteriaGetNoNameError() {
    // Step: the criteria values use the state name fruit; one key is backticked too.
    const questionsText = '{"choicetest":{"type":"choice","instructions":"what kind of fruit is `fruit`?","criteria":{"`fruit`":"`fruit`","apple":"`fruit`","banana":"banana","peach":"peach","other":"something else"}}}';
    // Step: every value resolves from the state, so the name check reports nothing.
    expect(collectQuestionsEditorDiagnostics(getFruitState(), questionsText)).toEqual([]);
}

function validateNamesPointingToObjectsGetErrors() {
    // Step: data is an object in the state, localValue is an object in the question.
    const questionsText = '{"dataCheck":{"type":"noul","localValue":{"a":"fruit"},"instructions":"is `data` the same as `localValue`?","criteria":{"true":"Yes, they\'re the same","false":"No, they are different"}}}';
    const diagnostics = collectQuestionsEditorDiagnostics('{"fruit":"apple","data":{"a":"fruit"}}', questionsText);
    // Step: both names are wrong, because a name must not point to an object or array.
    const dataFrom = questionsText.indexOf('`data`') + 1;
    const localValueFrom = questionsText.indexOf('`localValue`') + 1;
    expect(diagnostics).toEqual([
        { from: dataFrom, to: dataFrom + 'data'.length, severity: 'error', message: '`data` must not point to an object or array' },
        { from: localValueFrom, to: localValueFrom + 'localValue'.length, severity: 'error', message: '`localValue` must not point to an object or array' },
    ]);
}

function validateBacktickedNameInAKeyGetsNoNameError() {
    // Step: an unknown name used only as a key gets no name error; the key check reports it.
    expect(collectQuestionsEditorDiagnostics(getFruitState(), '{"q": {"`nope`": "x"}}')).toEqual([]);
}

test('test_name_pointing_to_backticked_text_gets_no_error', validateNamePointingToBacktickedTextGetsNoError);
test('test_backticked_values_in_choice_criteria_get_no_name_error', validateBacktickedValuesInChoiceCriteriaGetNoNameError);
test('test_names_pointing_to_objects_get_errors', validateNamesPointingToObjectsGetErrors);
test('test_backticked_name_in_a_key_gets_no_name_error', validateBacktickedNameInAKeyGetsNoNameError);
