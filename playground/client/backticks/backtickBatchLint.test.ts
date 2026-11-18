import { describe, test, expect, afterEach, spyOn } from 'bun:test';
import { json } from '@codemirror/lang-json';
import type { Diagnostic } from '@codemirror/lint';
import { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { isOtherEditorChanged, refreshBothEditorLints } from './backtickEditors';
import { buildUndefinedNameSource } from './backtickLint';
import * as editors from '../editors/editors';
import { getQuestionsEditorFacet } from '../questions/questionNames';
import { pageState } from '../page/state';

function createJsonState(text: string): EditorState {
    return EditorState.create({ doc: text, extensions: [json()] });
}

function resetBatchOff() {
    pageState.isBatchOn = false;
}

function getNotFoundMessage(): string {
    return '`name` is not in state or in this question';
}

function getQuestionsLintMessages(stateText: string, questionsText: string): string[] {
    const questionsState = EditorState.create({ doc: questionsText, extensions: [json(), getQuestionsEditorFacet().of(true)] });
    function getBothStates() {
        return [createJsonState(stateText), questionsState];
    }
    const source = buildUndefinedNameSource(getBothStates);
    const diagnostics = source({ state: questionsState } as unknown as EditorView) as Diagnostic[];
    const messages: string[] = [];
    for (const diagnostic of diagnostics) {
        messages.push(diagnostic.message);
    }
    return messages;
}

function validateBatchOnNameIsDefinedWhenEveryItemHasIt() {
    // Step: batch is on and the state text is an array where both items have `name`.
    pageState.isBatchOn = true;
    const messages = getQuestionsLintMessages('[{"name": "a"}, {"name": "b"}]', '{"q": "`name`"}');
    // Step: the name is defined, so there is no error.
    expect(messages).toEqual([]);
}

function validateBatchOnNameGivesAnErrorWhenOneItemLacksIt() {
    // Step: the second item has no `name`, and the questions do not define it.
    pageState.isBatchOn = true;
    const messages = getQuestionsLintMessages('[{"name": "a"}, {"other": "b"}]', '{"q": "`name`"}');
    expect(messages).toEqual([getNotFoundMessage()]);
}

function validateBatchOnNameIsDefinedWhenTheQuestionsDefineItEvenIfAnItemLacksIt() {
    pageState.isBatchOn = true;
    // Step: the question declares `name` in its own object.
    const messages = getQuestionsLintMessages('[{"name": "a"}, {"other": "b"}]', '{"q": {"name": "c", "text": "`name`"}}');
    expect(messages).toEqual([]);
}

function validateBatchOnWithoutAValidArrayUsesTodaysCheck() {
    // Step: batch is on, the state text is a single object with `name`.
    pageState.isBatchOn = true;
    expect(getQuestionsLintMessages('{"name": "a"}', '{"q": "`name`"}')).toEqual([]);
    // Step: batch is on and the state text is broken: the name check reports nothing.
    expect(getQuestionsLintMessages('[{"name": 1}, {"other": 2', '{"q": "`name`"}')).toEqual([]);
    // Step: an empty array also uses today's check, which finds no name.
    expect(getQuestionsLintMessages('[]', '{"q": "`name`"}')).toEqual([getNotFoundMessage()]);
}

function validateBatchOffArrayStateUsesTodaysCheck() {
    // Step: batch is off, so the array is the state and `name` is not a top-level key of it.
    pageState.isBatchOn = false;
    expect(getQuestionsLintMessages('[{"name": "a"}, {"other": "b"}]', '{"q": "`name`"}')).toEqual([getNotFoundMessage()]);
}

function validateBatchOnPathNamesWorkInEveryItem() {
    pageState.isBatchOn = true;
    const messages = getQuestionsLintMessages('[{"a": {"b": "x"}}, {"a": {"c": "y"}}]', '{"q": "`a.b`"}');
    expect(messages).toEqual(['`a.b` is not in state or in this question']);
}

function validateRelintSendsTheRefreshEffectToBothEditors() {
    // Step: two stub editors record what they get.
    const specs: unknown[][] = [[], []];
    function buildStub(received: unknown[]) {
        return { dispatch: (spec: unknown) => received.push(spec) } as unknown as EditorView;
    }
    const stateMock = spyOn(editors, 'getStateEditor').mockReturnValue(buildStub(specs[0]));
    const questionsMock = spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildStub(specs[1]));
    refreshBothEditorLints();
    stateMock.mockRestore();
    questionsMock.mockRestore();
    // Step: both editors got one transaction that the lint reads as an other-editor change.
    expect(specs[0].length).toBe(1);
    expect(specs[1].length).toBe(1);
    const update = { transactions: [EditorState.create({}).update(specs[0][0] as never)] };
    expect(isOtherEditorChanged(update as never)).toBe(true);
}

function registerBatchLintTests() {
    afterEach(resetBatchOff);
    test('test_batch_on_name_is_defined_when_every_item_has_it', validateBatchOnNameIsDefinedWhenEveryItemHasIt);
    test('test_batch_on_name_gives_an_error_when_one_item_lacks_it', validateBatchOnNameGivesAnErrorWhenOneItemLacksIt);
    test('test_batch_on_name_is_defined_when_the_questions_define_it_even_if_an_item_lacks_it', validateBatchOnNameIsDefinedWhenTheQuestionsDefineItEvenIfAnItemLacksIt);
    test('test_batch_on_without_a_valid_array_uses_todays_check', validateBatchOnWithoutAValidArrayUsesTodaysCheck);
    test('test_batch_off_array_state_uses_todays_check', validateBatchOffArrayStateUsesTodaysCheck);
    test('test_batch_on_path_names_work_in_every_item', validateBatchOnPathNamesWorkInEveryItem);
    test('test_relint_sends_the_refresh_effect_to_both_editors', validateRelintSendsTheRefreshEffectToBothEditors);
}

describe('backtick batch lint', registerBatchLintTests);
