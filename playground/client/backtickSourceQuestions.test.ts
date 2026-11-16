import { test, expect, afterEach } from 'bun:test';
import { CompletionContext } from '@codemirror/autocomplete';
import type { CompletionResult } from '@codemirror/autocomplete';
import { json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import { buildBacktickSource } from './backtickSource';
import { IS_QUESTIONS_EDITOR } from './questionNames';
import { pageState } from './state';

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

function listLabels(result: CompletionResult | null): string[] {
    if (result === null)
        throw new Error('no result');
    const labels: string[] = [];
    for (let i = 0; i < result.options.length; i++)
        labels.push(result.options[i].label);
    return labels;
}

function listQuestionsEditorLabels(questionsText: string, pos: number): string[] {
    const source = buildBacktickSource(() => [createJsonState(FRUIT_STATE), createQuestionsState(questionsText)]);
    const context = new CompletionContext(createQuestionsState(questionsText), pos, false);
    return listLabels(source(context) as CompletionResult | null);
}

function validateBacktickListsFirstEditorNamesFirstWithoutDuplicates() {
    // Updated: the questions editor offers state names plus names inside the enclosing question only.
    const questionsText = '{"q": {"mood": 1, "b": "`"}}';
    const questionsState = createQuestionsState(questionsText);
    const states = [createJsonState('{"mood": 1, "a": 2}'), questionsState];
    const source = buildBacktickSource(() => states);
    const pos = questionsText.indexOf('`') + 1;
    const result = source(new CompletionContext(questionsState, pos, false)) as CompletionResult | null;
    expect(listLabels(result)).toEqual(['mood', 'a', 'b']);
    expect(result?.from).toBe(pos);
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
    const context = new CompletionContext(createJsonState('`'), 1, false);
    // Step: after a lone backtick, only a is offered.
    expect(listLabels(source(context) as CompletionResult | null)).toEqual(['a']);
}

test('test_batch_backtick_lists_only_keys_every_item_has', validateBatchBacktickListsOnlyKeysEveryItemHas);
test('test_dot_after_an_escaped_backtick_lists_nothing', validateDotAfterAnEscapedBacktickListsNothing);
test('test_backtick_in_cross_name_lists_state_names_but_not_other_question_names', validateBacktickInCrossNameListsStateNamesButNotOtherQuestionNames);
test('test_backtick_in_own_name_lists_its_own_names', validateBacktickInOwnNameListsItsOwnNames);
test('test_dot_in_a_question_lists_child_names_from_that_question_only', validateDotInAQuestionListsChildNamesFromThatQuestionOnly);
test('test_backtick_lists_first_editor_names_first_without_duplicates', validateBacktickListsFirstEditorNamesFirstWithoutDuplicates);
