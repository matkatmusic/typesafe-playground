import { test, expect, afterEach } from 'bun:test';
import { json } from '@codemirror/lang-json';
import type { Diagnostic } from '@codemirror/lint';
import { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { buildUndefinedNameSource } from './backtickLint';
import { IS_QUESTIONS_EDITOR } from '../questions/questionNames';
import { pageState } from '../page/state';

afterEach(() => {
    pageState.isBatchOn = false;
});

const FRUIT_STATE = '{"fruit": "apple"}';
const SCOPE_QUESTIONS = '{"ownName":{"type":"noul","instructions":{"task":"Is `secretWord` the word banana?","secretWord":"banana"}},"crossName":{"type":"noul","instructions":"Is `secretWord` the word banana?"},"stateName":{"type":"noul","instructions":"Is `fruit` the word apple?"}}';

function createJsonState(text: string): EditorState {
    return EditorState.create({ doc: text, extensions: [json()] });
}

function createQuestionsState(text: string): EditorState {
    return EditorState.create({ doc: text, extensions: [json(), IS_QUESTIONS_EDITOR.of(true)] });
}

function lintQuestionsEditor(stateText: string, questionsText: string): Diagnostic[] {
    const questionsState = createQuestionsState(questionsText);
    const source = buildUndefinedNameSource(() => [createJsonState(stateText), questionsState]);
    return source({ state: questionsState } as unknown as EditorView) as Diagnostic[];
}

function validateUndefinedBacktickedNamesGetErrorDiagnostics() {
    // Updated: names must point to text now, and messages come from the shared library.
    const firstState = createJsonState('{"mood": "calm", "q": {"b": "two"}}');
    const secondState = createQuestionsState('{"x": "`mood` `nope` `q.b` `q.z`"}');
    const source = buildUndefinedNameSource(() => [firstState, secondState]);
    const diagnostics = source({ state: secondState } as unknown as EditorView);
    const text = secondState.doc.toString();
    const nopeFrom = text.indexOf('nope');
    const zFrom = text.indexOf('q.z');
    expect(diagnostics).toEqual([
        { from: nopeFrom, to: nopeFrom + 4, severity: 'error', message: '`nope` is not in state or in this question' },
        { from: zFrom, to: zFrom + 3, severity: 'error', message: '`q.z` is not in state or in this question' },
    ]);
}

function validateNameFromAnotherQuestionGetsAnError() {
    // Step: ownName declares secretWord, crossName uses it without declaring it, stateName uses a state name.
    const diagnostics = lintQuestionsEditor(FRUIT_STATE, SCOPE_QUESTIONS);
    // Step: only crossName's secretWord is wrong, because a question cannot read another question.
    const nameFrom = SCOPE_QUESTIONS.indexOf('`secretWord`', SCOPE_QUESTIONS.indexOf('"crossName"')) + 1;
    expect(diagnostics).toEqual([
        { from: nameFrom, to: nameFrom + 'secretWord'.length, severity: 'error', message: '`secretWord` is not in state or in this question' },
    ]);
}

function validateNamePointingToBacktickedTextGetsAnError() {
    // Step: banana is declared in the question, but its text holds another backticked name.
    const questionsText = '{"scopeDeclarationInInstructions":{"type":"choice","instructions":{"question":"is `fruit` the same word as `banana`?","banana":"`fruit`"},"criteria":{"Yes":"yes they are the same word","no":"no they are different words","something else":"cannot determine"}}}';
    const diagnostics = lintQuestionsEditor(FRUIT_STATE, questionsText);
    // Step: only `banana` in the question text is wrong, because TypeSafe resolves one level.
    const nameFrom = questionsText.indexOf('`banana`') + 1;
    expect(diagnostics).toEqual([
        { from: nameFrom, to: nameFrom + 'banana'.length, severity: 'error', message: '`banana` points to text with backticks; TypeSafe resolves only one level' },
    ]);
}

function validateBacktickedValuesInChoiceCriteriaGetNoNameError() {
    // Step: the criteria values use the state name fruit; one key is backticked too.
    const questionsText = '{"choicetest":{"type":"choice","instructions":"what kind of fruit is `fruit`?","criteria":{"`fruit`":"`fruit`","apple":"`fruit`","banana":"banana","peach":"peach","other":"something else"}}}';
    // Step: every value resolves from the state, so the name check reports nothing.
    expect(lintQuestionsEditor(FRUIT_STATE, questionsText)).toEqual([]);
}

function validateNamesPointingToObjectsGetErrors() {
    // Step: data is an object in the state, localValue is an object in the question.
    const questionsText = '{"dataCheck":{"type":"noul","localValue":{"a":"fruit"},"instructions":"is `data` the same as `localValue`?","criteria":{"true":"Yes, they\'re the same","false":"No, they are different"}}}';
    const diagnostics = lintQuestionsEditor('{"fruit":"apple","data":{"a":"fruit"}}', questionsText);
    // Step: both names are wrong, because a name must not point to an object or array.
    const dataFrom = questionsText.indexOf('`data`') + 1;
    const localValueFrom = questionsText.indexOf('`localValue`') + 1;
    expect(diagnostics).toEqual([
        { from: dataFrom, to: dataFrom + 'data'.length, severity: 'error', message: '`data` must not point to an object or array' },
        { from: localValueFrom, to: localValueFrom + 'localValue'.length, severity: 'error', message: '`localValue` must not point to an object or array' },
    ]);
}

function validateBatchItemWithoutTheNameGetsAnError() {
    // Step: batch is on and the second state item has no fruit.
    pageState.isBatchOn = true;
    const questionsText = '{"stateName":{"type":"noul","instructions":"Is `fruit` the word apple?"}}';
    const diagnostics = lintQuestionsEditor('[{"fruit": "apple"}, {"other": "pear"}]', questionsText);
    // Step: fruit is wrong, because one batch item cannot resolve it.
    const nameFrom = questionsText.indexOf('`fruit`') + 1;
    expect(diagnostics).toEqual([
        { from: nameFrom, to: nameFrom + 'fruit'.length, severity: 'error', message: '`fruit` is not in state or in this question' },
    ]);
}

function validateBacktickedNameInAKeyGetsNoNameError() {
    // Step: an unknown name used only as a key gets no name error; the key check reports it.
    expect(lintQuestionsEditor(FRUIT_STATE, '{"q": {"`nope`": "x"}}')).toEqual([]);
}

function validateStateEditorNamesResolveFromTheStateOnly() {
    // Step: the state uses secretWord, which only a question declares.
    const stateText = '{"fruit": "apple", "note": "`secretWord`"}';
    const stateState = createJsonState(stateText);
    const source = buildUndefinedNameSource(() => [stateState, createQuestionsState(SCOPE_QUESTIONS)]);
    const diagnostics = source({ state: stateState } as unknown as EditorView);
    // Step: the state editor does not read questions, so secretWord is wrong.
    const nameFrom = stateText.indexOf('secretWord');
    expect(diagnostics).toEqual([
        { from: nameFrom, to: nameFrom + 'secretWord'.length, severity: 'error', message: '`secretWord` is not in state or in this question' },
    ]);
}

function validateNameCheckSkipsInvalidJson() {
    // Step: the state JSON is broken; the JSON parse linter already shows it.
    expect(lintQuestionsEditor('{"fruit": ', '{"q": "`nope`"}')).toEqual([]);
    // Step: the questions JSON is broken.
    expect(lintQuestionsEditor(FRUIT_STATE, '{"q": "`nope`"')).toEqual([]);
}

function validateEscapedBacktickedNameInQuestionsGetsNoNameError() {
    // Step: the questions text has a word inside escaped backticks, and the state does not have that word.
    const questionsText = '{"q":{"type":"noul","instructions":"Is \\\\`fruit\\\\` here?"}}';
    // Step: the escaped backticks are plain text, so no name is checked.
    expect(lintQuestionsEditor('{"other":"x"}', questionsText)).toEqual([]);
}

function validateNamePointingToEscapedBackticksGetsNoError() {
    // Step: the state value for banana has only escaped backticks.
    const stateText = '{"banana":"say \\\\`hi\\\\`"}';
    // Step: the question names banana, and the name check reports nothing.
    expect(lintQuestionsEditor(stateText, '{"q":{"type":"noul","instructions":"Is `banana` ripe?"}}')).toEqual([]);
}

test('test_escaped_backticked_name_in_questions_gets_no_name_error', validateEscapedBacktickedNameInQuestionsGetsNoNameError);
test('test_name_pointing_to_escaped_backticks_gets_no_error', validateNamePointingToEscapedBackticksGetsNoError);
test('test_name_from_another_question_gets_an_error', validateNameFromAnotherQuestionGetsAnError);
test('test_name_pointing_to_backticked_text_gets_an_error', validateNamePointingToBacktickedTextGetsAnError);
test('test_backticked_values_in_choice_criteria_get_no_name_error', validateBacktickedValuesInChoiceCriteriaGetNoNameError);
test('test_names_pointing_to_objects_get_errors', validateNamesPointingToObjectsGetErrors);
test('test_batch_item_without_the_name_gets_an_error', validateBatchItemWithoutTheNameGetsAnError);
test('test_backticked_name_in_a_key_gets_no_name_error', validateBacktickedNameInAKeyGetsNoNameError);
test('test_state_editor_names_resolve_from_the_state_only', validateStateEditorNamesResolveFromTheStateOnly);
test('test_name_check_skips_invalid_json', validateNameCheckSkipsInvalidJson);
test('test_undefined_backticked_names_get_error_diagnostics', validateUndefinedBacktickedNamesGetErrorDiagnostics);
