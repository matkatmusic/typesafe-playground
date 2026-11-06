import { test, expect, afterEach } from 'bun:test';
import { acceptCompletion, CompletionContext } from '@codemirror/autocomplete';
import type { CompletionResult } from '@codemirror/autocomplete';
import { indentWithTab } from '@codemirror/commands';
import { json } from '@codemirror/lang-json';
import type { Diagnostic } from '@codemirror/lint';
import { IS_QUESTIONS_EDITOR } from './questionNames';
import { pageState } from './state';
import { basicSetup } from 'codemirror';
import { EditorState, Prec } from '@codemirror/state';
import { keymap, type EditorView } from '@codemirror/view';
import { buildBacktickSource, buildNameOptions, buildUndefinedNameSource, createBacktickKeyNames, listBothEditorStates } from './backtickCompletion';

function validateOptionsInsertNameThenBacktick() {
  const options = buildNameOptions(['mood']);
  expect(options[0].label).toBe('mood');
  expect(options[0].apply).toBe('mood`');
}

function createJsonState(text: string): EditorState {
  return EditorState.create({ doc: text, extensions: [json()] });
}

function createContext(typedText: string): CompletionContext {
  return new CompletionContext(createJsonState(typedText), typedText.length, false);
}

function listLabels(result: CompletionResult | null): string[] {
  if (result === null)
    throw new Error('no result');
  const labels: string[] = [];
  for (let i = 0; i < result.options.length; i++)
    labels.push(result.options[i].label);
  return labels;
}

function validateBacktickListsFirstEditorNamesFirstWithoutDuplicates() {
  // Updated: the questions editor offers state names plus names inside the enclosing question only.
  // const states = [createJsonState('{"mood": 1, "a": 2}'), createJsonState('{"q": {"mood": 1, "b": 2}}')];
  // const source = buildBacktickSource(() => states);
  // const result = source(createContext('`')) as CompletionResult | null;
  // expect(listLabels(result)).toEqual(['mood', 'a', 'q', 'b']);
  // expect(result?.from).toBe(1);
  const questionsText = '{"q": {"mood": 1, "b": "`"}}';
  const questionsState = createQuestionsState(questionsText);
  const states = [createJsonState('{"mood": 1, "a": 2}'), questionsState];
  const source = buildBacktickSource(() => states);
  const pos = questionsText.indexOf('`') + 1;
  const result = source(new CompletionContext(questionsState, pos, false)) as CompletionResult | null;
  expect(listLabels(result)).toEqual(['mood', 'a', 'b']);
  expect(result?.from).toBe(pos);
}

function validateNoListWithoutBacktick() {
  const source = buildBacktickSource(() => [createJsonState('{"a": 1}')]);
  expect(source(createContext('x'))).toBe(null);
  expect(source(createContext(''))).toBe(null);
}

function validateStatesAreReadWhenTyping() {
  const states = [createJsonState('{}')];
  const source = buildBacktickSource(() => states);
  states[0] = createJsonState('{"late": 1}');
  expect(listLabels(source(createContext('`')) as CompletionResult | null)).toEqual(['late']);
}

const NESTED_STATE_TEXT = '{"message": {"text": 1, "x": {"deep": 2}}, "other": 3}';

function validateBacktickListsOnlyTopLevelStateKeys() {
  // Step: the state has a nested object with its own keys.
  const source = buildBacktickSource(() => [createJsonState(NESTED_STATE_TEXT)]);
  // Step: after a lone backtick, only the top-level keys are offered.
  expect(listLabels(source(createContext('`')) as CompletionResult | null)).toEqual(['message', 'other']);
}

function validateDotListsChildKeysOfTheKey() {
  const source = buildBacktickSource(() => [createJsonState(NESTED_STATE_TEXT)]);
  const result = source(createContext('`message.')) as CompletionResult | null;
  expect(listLabels(result)).toEqual(['text', 'x']);
  expect(result?.from).toBe(9);
  expect(result?.options[0].apply).toBe('text`');
}

function validateDotListsChildKeysAtAnyDepth() {
  const source = buildBacktickSource(() => [createJsonState(NESTED_STATE_TEXT)]);
  expect(listLabels(source(createContext('`message.x.')) as CompletionResult | null)).toEqual(['deep']);
}

function validateDotListsNothingWithoutObjectChildren() {
  const source = buildBacktickSource(() => [createJsonState(NESTED_STATE_TEXT)]);
  expect(source(createContext('`other.'))).toBe(null);
  expect(source(createContext('`message.text.'))).toBe(null);
  expect(source(createContext('`missing.'))).toBe(null);
}

function validateDotOutsideABacktickKeyListsNothing() {
  const source = buildBacktickSource(() => [createJsonState(NESTED_STATE_TEXT)]);
  expect(source(createContext('message.'))).toBe(null);
  expect(source(createContext('`message `.'))).toBe(null);
  expect(source(createContext('`.'))).toBe(null);
  expect(source(createContext('`message..'))).toBe(null);
}

function validateNoListWhileReadOnly() {
  const lockedState = EditorState.create({ doc: '`', extensions: [json(), EditorState.readOnly.of(true)] });
  const lockedContext = new CompletionContext(lockedState, 1, false);
  const source = buildBacktickSource(() => [createJsonState('{"a": 1}')]);
  expect(source(lockedContext)).toBe(null);
}

function validateExtensionBuildsBeforeEditorsExist() {
  const extension = createBacktickKeyNames();
  const state = EditorState.create({ doc: '', extensions: [basicSetup, extension] });
  expect(state.doc.length).toBe(0);
  expect(() => listBothEditorStates()).toThrow('state editor is not created yet');
}

function validateTabAcceptsTheCompletionBeforeIndentAndPlaceholderTab() {
  const placeholderTab = keymap.of([{ key: 'Tab', run: () => true }]);
  const extensions = [basicSetup, keymap.of([indentWithTab]), Prec.high(placeholderTab), createBacktickKeyNames()];
  const state = EditorState.create({ doc: '', extensions: extensions });
  const tabBindings = [];
  for (const bindingList of state.facet(keymap))
    for (const binding of bindingList)
      if (binding.key === 'Tab')
        tabBindings.push(binding);
  expect(tabBindings.length).toBeGreaterThan(2);
  expect(tabBindings[0].run).toBe(acceptCompletion);
  expect(acceptCompletion({ state } as EditorView)).toBe(false);
}

function validateUndefinedBacktickedNamesGetErrorDiagnostics() {
  // Updated: names must point to text now, and messages come from the shared library.
  // const firstState = createJsonState('{"mood": 1, "q": {"b": 2}}');
  const firstState = createJsonState('{"mood": "calm", "q": {"b": "two"}}');
  const secondState = createQuestionsState('{"x": "`mood` `nope` `q.b` `q.z`"}');
  const source = buildUndefinedNameSource(() => [firstState, secondState]);
  const diagnostics = source({ state: secondState } as unknown as EditorView);
  const text = secondState.doc.toString();
  const nopeFrom = text.indexOf('nope');
  const zFrom = text.indexOf('q.z');
  expect(diagnostics).toEqual([
    // Old: errors on nope and q.z with message '<name> is not defined in either JSON editor'.
    { from: nopeFrom, to: nopeFrom + 4, severity: 'error', message: '`nope` is not in state or in this question' },
    { from: zFrom, to: zFrom + 3, severity: 'error', message: '`q.z` is not in state or in this question' },
  ]);
}

const FRUIT_STATE = '{"fruit": "apple"}';
const SCOPE_QUESTIONS = '{"ownName":{"type":"noul","instructions":{"task":"Is `secretWord` the word banana?","secretWord":"banana"}},"crossName":{"type":"noul","instructions":"Is `secretWord` the word banana?"},"stateName":{"type":"noul","instructions":"Is `fruit` the word apple?"}}';

function createQuestionsState(text: string): EditorState {
  return EditorState.create({ doc: text, extensions: [json(), IS_QUESTIONS_EDITOR.of(true)] });
}

function lintQuestionsEditor(stateText: string, questionsText: string): Diagnostic[] {
  const questionsState = createQuestionsState(questionsText);
  const source = buildUndefinedNameSource(() => [createJsonState(stateText), questionsState]);
  return source({ state: questionsState } as unknown as EditorView) as Diagnostic[];
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
    // Old expectation: both names had the error "must point to text".
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

function listQuestionsEditorLabels(questionsText: string, pos: number): string[] {
  const source = buildBacktickSource(() => [createJsonState(FRUIT_STATE), createQuestionsState(questionsText)]);
  const context = new CompletionContext(createQuestionsState(questionsText), pos, false);
  return listLabels(source(context) as CompletionResult | null);
}

function validateBacktickInCrossNameListsStateNamesButNotOtherQuestionNames() {
  // Step: the backtick is typed inside crossName, which declares no names of its own.
  const pos = SCOPE_QUESTIONS.indexOf('`secretWord`', SCOPE_QUESTIONS.indexOf('"crossName"')) + 1;
  const labels = listQuestionsEditorLabels(SCOPE_QUESTIONS, pos);
  // Step: the state name is offered; ownName's secretWord is not.
  expect(labels).toContain('fruit');
  expect(labels).not.toContain('secretWord');
}

function validateBacktickInOwnNameListsItsOwnNames() {
  // Step: the backtick is typed inside ownName, which declares secretWord.
  const pos = SCOPE_QUESTIONS.indexOf('`secretWord`') + 1;
  // Step: state names come first, then the names inside ownName.
  expect(listQuestionsEditorLabels(SCOPE_QUESTIONS, pos)).toEqual(['fruit', 'type', 'instructions', 'task', 'secretWord']);
}

function validateDotInAQuestionListsChildNamesFromThatQuestionOnly() {
  // Step: questions p and q both declare `local`, with different children.
  const questionsText = '{"p": {"local": {"other": "y"}}, "q": {"local": {"inner": "x"}, "text": "`local."}}';
  // Step: the dot is typed inside q, so only q's child names are offered.
  expect(listQuestionsEditorLabels(questionsText, questionsText.indexOf('`local.') + '`local.'.length)).toEqual(['inner']);
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

function validateDotAfterAnEscapedBacktickListsNothing() {
  // Step: the state has a message key with a text child.
  const stateText = '{ "message": { "text": "hi" } }';
  // Step: the questions text has an escaped backtick, then message and a dot.
  const questionsText = '{"q": {"instructions": "Use \\\\`message."}}';
  const questionsState = createQuestionsState(questionsText);
  const source = buildBacktickSource(() => [createJsonState(stateText), questionsState]);
  // Step: the cursor is right after the dot.
  const pos = questionsText.indexOf('message.') + 'message.'.length;
  // Step: the backtick is plain text, so no list opens.
  expect(source(new CompletionContext(questionsState, pos, false))).toBe(null);
}

function validateBatchBacktickListsOnlyKeysEveryItemHas() {
  // Step: batch is on, and the second item has no b.
  pageState.isBatchOn = true;
  const source = buildBacktickSource(() => [createJsonState('[{"a":1,"b":2},{"a":3}]')]);
  // Step: after a lone backtick, only a is offered.
  expect(listLabels(source(createContext('`')) as CompletionResult | null)).toEqual(['a']);
}

afterEach(() => {
  pageState.isBatchOn = false;
});

test('test_escaped_backticked_name_in_questions_gets_no_name_error', validateEscapedBacktickedNameInQuestionsGetsNoNameError);
test('test_name_pointing_to_escaped_backticks_gets_no_error', validateNamePointingToEscapedBackticksGetsNoError);
test('test_batch_backtick_lists_only_keys_every_item_has', validateBatchBacktickListsOnlyKeysEveryItemHas);
test('test_dot_after_an_escaped_backtick_lists_nothing', validateDotAfterAnEscapedBacktickListsNothing);

test('test_backtick_in_cross_name_lists_state_names_but_not_other_question_names', validateBacktickInCrossNameListsStateNamesButNotOtherQuestionNames);
test('test_backtick_in_own_name_lists_its_own_names', validateBacktickInOwnNameListsItsOwnNames);
test('test_dot_in_a_question_lists_child_names_from_that_question_only', validateDotInAQuestionListsChildNamesFromThatQuestionOnly);

test('test_name_from_another_question_gets_an_error', validateNameFromAnotherQuestionGetsAnError);
test('test_name_pointing_to_backticked_text_gets_an_error', validateNamePointingToBacktickedTextGetsAnError);
test('test_backticked_values_in_choice_criteria_get_no_name_error', validateBacktickedValuesInChoiceCriteriaGetNoNameError);
test('test_names_pointing_to_objects_get_errors', validateNamesPointingToObjectsGetErrors);
test('test_batch_item_without_the_name_gets_an_error', validateBatchItemWithoutTheNameGetsAnError);
test('test_backticked_name_in_a_key_gets_no_name_error', validateBacktickedNameInAKeyGetsNoNameError);
test('test_state_editor_names_resolve_from_the_state_only', validateStateEditorNamesResolveFromTheStateOnly);
test('test_name_check_skips_invalid_json', validateNameCheckSkipsInvalidJson);
test('test_tab_accepts_the_completion_before_indent_and_placeholder_tab', validateTabAcceptsTheCompletionBeforeIndentAndPlaceholderTab);
test('test_options_insert_name_then_backtick', validateOptionsInsertNameThenBacktick);
test('test_backtick_lists_first_editor_names_first_without_duplicates', validateBacktickListsFirstEditorNamesFirstWithoutDuplicates);
test('test_no_list_without_a_backtick', validateNoListWithoutBacktick);
test('test_states_are_read_when_typing', validateStatesAreReadWhenTyping);
test('test_backtick_lists_only_top_level_state_keys', validateBacktickListsOnlyTopLevelStateKeys);
test('test_dot_lists_child_keys_of_the_key',validateDotListsChildKeysOfTheKey);
test('test_dot_lists_child_keys_at_any_depth', validateDotListsChildKeysAtAnyDepth);
test('test_dot_lists_nothing_without_object_children', validateDotListsNothingWithoutObjectChildren);
test('test_dot_outside_a_backtick_key_lists_nothing', validateDotOutsideABacktickKeyListsNothing);
test('test_no_list_while_read_only', validateNoListWhileReadOnly);
test('test_extension_builds_before_editors_exist', validateExtensionBuildsBeforeEditorsExist);
test('test_undefined_backticked_names_get_error_diagnostics', validateUndefinedBacktickedNamesGetErrorDiagnostics);
