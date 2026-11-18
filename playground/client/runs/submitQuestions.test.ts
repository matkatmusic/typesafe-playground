import { test, expect, mock, spyOn } from 'bun:test';
import * as editors from '../editors/editors';
import { executeSubmit, getSubmitText } from './submit';
import { buildStubStateEditor, installFakeDom, removeFakeDom } from './submitFakeDom';

function disableLocking() {}

function installStubEditors(stateText: string, questionsText: string) {
    spyOn(editors, 'getStateEditor').mockReturnValue(buildStubStateEditor(stateText));
    spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildStubStateEditor(questionsText));
    return spyOn(editors, 'setEditorLocked').mockImplementation(disableLocking);
}

function installCountingFetch() {
    const counter = { fetchCount: 0 };
    async function fetchStubResponse() {
        counter.fetchCount += 1;
        return new Response('{}');
    }
    globalThis.fetch = fetchStubResponse as unknown as typeof fetch;
    return counter;
}

async function executeBlockedSubmit(stateText: string, questionsText: string) {
    const elements = installFakeDom(false);
    const lockSpy = installStubEditors(stateText, questionsText);
    const counter = installCountingFetch();
    await executeSubmit();
    const isLockCalled = lockSpy.mock.calls.length > 0;
    mock.restore();
    removeFakeDom();
    return { elements, fetchCount: counter.fetchCount, isLockCalled };
}

async function validateInvalidQuestionsShowTheErrorAndSendNothing() {
    // Step: the questions text is not valid JSON.
    const result = await executeBlockedSubmit('{"a":1}', '{"q":');
    // Step: the error line says so, the button resets, and no run starts.
    expect(result.elements.errorLine.textContent.startsWith('questions is not valid JSON: ')).toBe(true);
    expect(result.elements.submitButton.disabled).toBe(false);
    expect(result.elements.submitButton.textContent).toBe(getSubmitText());
    expect(result.isLockCalled).toBe(false);
    expect(result.fetchCount).toBe(0);
}

async function validateWrongQuestionTypeShowsTheErrorAndSendsNothing() {
    // Step: the questions text parses as JSON, but the question type is not a TypeSafe type.
    const result = await executeBlockedSubmit('{"a":1}', '{"q":{"type":"wrong"}}');
    // Step: the error line names the bad type, and no run starts.
    expect(result.elements.errorLine.textContent).toBe('q.type must be noul, choice, score or box');
    expect(result.elements.submitButton.disabled).toBe(false);
    expect(result.isLockCalled).toBe(false);
    expect(result.fetchCount).toBe(0);
}

async function validateNameFromAnotherQuestionShowsTheErrorAndSendsNothing() {
    // Step: secretWord is only in ownName's own object; crossName uses it too.
    const questionsText = '{"ownName":{"type":"noul","instructions":{"task":"Is `secretWord` the word banana?","secretWord":"banana"}},"crossName":{"type":"noul","instructions":"Is `secretWord` the word banana?"}}';
    const result = await executeBlockedSubmit('{"fruit":"apple"}', questionsText);
    // Step: only crossName is reported, and no run starts.
    expect(result.elements.errorLine.textContent).toBe('crossName: `secretWord` is not in state or in this question');
    expect(result.elements.submitButton.disabled).toBe(false);
    expect(result.isLockCalled).toBe(false);
    expect(result.fetchCount).toBe(0);
}

test('test_invalid_questions_show_the_error_and_send_nothing', validateInvalidQuestionsShowTheErrorAndSendNothing);
test('test_wrong_question_type_shows_the_error_and_sends_nothing', validateWrongQuestionTypeShowsTheErrorAndSendsNothing);
test('test_name_from_another_question_shows_the_error_and_sends_nothing', validateNameFromAnotherQuestionShowsTheErrorAndSendsNothing);
