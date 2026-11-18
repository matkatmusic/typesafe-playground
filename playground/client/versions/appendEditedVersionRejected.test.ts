import { describe, test, expect, afterEach, mock } from 'bun:test';
import { appendEditedVersion } from './appendEditedVersion';
import { pageState } from '../page/state';
import { installOpenFetch, installPage, resetFakePage } from './appendEditedVersionFakePage';

async function validateInvalidJsonSendsNothingAndShowsTheError() {
    const { errorLine, refreshSpy } = installPage('{"a": 1}', '{"q": ');
    const seen = installOpenFetch();
    expect(await appendEditedVersion()).toBe(false);
    expect(seen).toEqual([]);
    expect(errorLine.textContent).toContain('questions is not valid JSON');
    expect(pageState.versions.length).toBe(1);
    expect(refreshSpy).not.toHaveBeenCalled();
}

async function validateBadStateTextShowsTheMessageAndSendsNothing() {
    for (const stateText of ['[1]', '3']) {
        const { errorLine, refreshSpy } = installPage(stateText, '{"q": 1}');
        const seen = installOpenFetch();
        expect(await appendEditedVersion()).toBe(false);
        expect(errorLine.textContent).toBe('state must be a JSON object');
        expect(seen).toEqual([]);
        expect(pageState.versions.length).toBe(1);
        expect(refreshSpy).not.toHaveBeenCalled();
        mock.restore();
    }
}

async function validateBadQuestionsTextShowsTheMessageAndSendsNothing() {
    for (const questionsText of ['[]', '3']) {
        const { errorLine, refreshSpy } = installPage('{"a": 2}', questionsText);
        const seen = installOpenFetch();
        expect(await appendEditedVersion()).toBe(false);
        expect(errorLine.textContent).toBe('questions must be a JSON object');
        expect(seen).toEqual([]);
        expect(pageState.versions.length).toBe(1);
        expect(refreshSpy).not.toHaveBeenCalled();
        mock.restore();
    }
}

async function validateUneditedTextSendsNothing() {
    installPage('{"a": 1}', '{ "q": 1 }');
    const seen = installOpenFetch();
    expect(await appendEditedVersion()).toBe(true);
    expect(seen).toEqual([]);
    expect(pageState.versions.length).toBe(1);
}

function registerRejectedTextTests() {
    afterEach(resetFakePage);
    test('test_invalid_json_sends_nothing_and_shows_the_error', validateInvalidJsonSendsNothingAndShowsTheError);
    test('test_bad_state_text_shows_the_message_and_sends_nothing', validateBadStateTextShowsTheMessageAndSendsNothing);
    test('test_bad_questions_text_shows_the_message_and_sends_nothing', validateBadQuestionsTextShowsTheMessageAndSendsNothing);
    test('test_unedited_text_sends_nothing', validateUneditedTextSendsNothing);
}

describe('appendEditedVersion rejected text', registerRejectedTextTests);
