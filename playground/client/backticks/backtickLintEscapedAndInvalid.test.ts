import { test, expect } from 'bun:test';
import { collectQuestionsEditorDiagnostics, getFruitState } from './backtickLintSupport';

function validateNameCheckSkipsInvalidJson() {
    // Step: the state JSON is broken; the JSON parse linter already shows it.
    expect(collectQuestionsEditorDiagnostics('{"fruit": ', '{"q": "`nope`"}')).toEqual([]);
    // Step: the questions JSON is broken.
    expect(collectQuestionsEditorDiagnostics(getFruitState(), '{"q": "`nope`"')).toEqual([]);
}

function validateEscapedBacktickedNameInQuestionsGetsNoNameError() {
    // Step: the questions text has a word inside escaped backticks, and the state does not have that word.
    const questionsText = '{"q":{"type":"noul","instructions":"Is \\\\`fruit\\\\` here?"}}';
    // Step: the escaped backticks are plain text, so no name is checked.
    expect(collectQuestionsEditorDiagnostics('{"other":"x"}', questionsText)).toEqual([]);
}

function validateNamePointingToEscapedBackticksGetsNoError() {
    // Step: the state value for banana has only escaped backticks.
    const stateText = '{"banana":"say \\\\`hi\\\\`"}';
    // Step: the question names banana, and the name check reports nothing.
    expect(collectQuestionsEditorDiagnostics(stateText, '{"q":{"type":"noul","instructions":"Is `banana` ripe?"}}')).toEqual([]);
}

test('test_escaped_backticked_name_in_questions_gets_no_name_error', validateEscapedBacktickedNameInQuestionsGetsNoNameError);
test('test_name_pointing_to_escaped_backticks_gets_no_error', validateNamePointingToEscapedBackticksGetsNoError);
test('test_name_check_skips_invalid_json', validateNameCheckSkipsInvalidJson);
