import { describe, test, expect, afterEach } from 'bun:test';
import { installFakeDocument, installStubQuestionsEditor, removeFakeState } from './questionQuickNavFakeDom';
import { moveQuestionIntoView } from './questionQuickNav';

function validateMoveQuestionIntoViewDispatchesOneScrollEffectAtTheQuestion() {
    const errorLine = installFakeDocument();
    const doc = '{"a": 1, "b": 2}';
    const stub = installStubQuestionsEditor(doc);
    moveQuestionIntoView('b');
    expect(stub.scrolledPositions).toEqual([doc.indexOf('"b"')]);
    expect(errorLine.textContent).toBe('');
}

function validateMoveQuestionIntoViewShowsAMessageAndDoesNotScrollForAMissingName() {
    const errorLine = installFakeDocument();
    const stub = installStubQuestionsEditor('{"a": 1}');
    moveQuestionIntoView('missing');
    expect(errorLine.textContent).toBe('question missing is not in the questions editor');
    expect(stub.scrolledPositions).toEqual([]);
}

function validateMoveToAPresentQuestionClearsOnlyTheMissingQuestionMessage() {
    const errorLine = installFakeDocument();
    installStubQuestionsEditor('{"a": 1}');
    moveQuestionIntoView('missing');
    expect(errorLine.textContent).toBe('question missing is not in the questions editor');
    moveQuestionIntoView('a');
    expect(errorLine.textContent).toBe('');
    errorLine.textContent = 'state is not valid JSON';
    moveQuestionIntoView('a');
    expect(errorLine.textContent).toBe('state is not valid JSON');
}

function registerMoveTests() {
    afterEach(removeFakeState);
    test('test_move_question_into_view_shows_a_message_and_does_not_scroll_for_a_missing_name', validateMoveQuestionIntoViewShowsAMessageAndDoesNotScrollForAMissingName);
    test('test_move_question_into_view_dispatches_one_scroll_effect_at_the_question', validateMoveQuestionIntoViewDispatchesOneScrollEffectAtTheQuestion);
    test('test_move_to_a_present_question_clears_only_the_missing_question_message', validateMoveToAPresentQuestionClearsOnlyTheMissingQuestionMessage);
}

describe('question quick nav move', registerMoveTests);
