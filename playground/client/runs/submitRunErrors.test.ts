import { describe, test, expect, afterEach, spyOn, mock } from 'bun:test';
import * as editors from '../editors/editors';
import { pageState } from '../page/state';
import { executeSubmit, getSubmitText } from './submit';
import { getVersion, buildStubStateEditor, installFakeDom, removeFakeDom } from './submitFakeDom';

async function fetchServerFailure() {
    return new Response('boom', { status: 500 });
}

async function validateFailedSubmitShowsTheErrorLineAndLeavesTheResultAlone() {
    const elements = installFakeDom(true);
    const renderSpy = spyOn(editors, 'renderResultJson');
    spyOn(editors, 'getStateEditor').mockReturnValue(buildStubStateEditor('{}'));
    spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildStubStateEditor('{"q":{"type":"noul"}}'));
    pageState.versions = [getVersion()];
    globalThis.fetch = fetchServerFailure as unknown as typeof fetch;
    await executeSubmit();
    expect(elements.errorLine.textContent).toBe('Run failed: 500 boom');
    expect(elements.lastEditedLabel.textContent).toBe('');
    expect(elements.submitButton.disabled).toBe(false);
    expect(elements.submitButton.textContent).toBe(getSubmitText());
    expect(renderSpy).not.toHaveBeenCalled();
    mock.restore();
}

async function validateInvalidStateShowsTheErrorAndSendsNothing() {
    const elements = installFakeDom(true);
    const stateSpy = spyOn(editors, 'getStateEditor').mockReturnValue(buildStubStateEditor('{"a":'));
    let fetchCount = 0;
    async function fetchCountingCalls() {
        fetchCount += 1;
        return new Response('{}');
    }
    globalThis.fetch = fetchCountingCalls as unknown as typeof fetch;
    await executeSubmit();
    stateSpy.mockRestore();
    expect(elements.errorLine.textContent.startsWith('state is not valid JSON: ')).toBe(true);
    expect(elements.submitButton.disabled).toBe(false);
    expect(fetchCount).toBe(0);
}

function registerRunErrorTests() {
    afterEach(removeFakeDom);
    test('test_invalid_state_shows_the_error_and_sends_nothing', validateInvalidStateShowsTheErrorAndSendsNothing);
    test('test_failed_submit_shows_the_error_line_and_leaves_the_result_alone', validateFailedSubmitShowsTheErrorLineAndLeavesTheResultAlone);
}

describe('submitRunErrors', registerRunErrorTests);
