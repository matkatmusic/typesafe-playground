import { describe, test, expect, afterEach } from 'bun:test';
import { createSubqClient } from './subqClient';
import { getHardCodedQuestions, getHardCodedState } from './typeSafeQuery';

function getSubqBody() {
    return { model: 'subq-snap-1.2', answers: { requestsAction: { type: 'noul', noul: 0.9 } }, usage: { input_tokens: 7, output_tokens: 0 } };
}

interface FetchCall { url: string; init: RequestInit }

function setFetchStub(calls: FetchCall[], status: number, body: unknown) {
    async function fetchStubbedResponse(url: string | URL | Request, init?: RequestInit) {
        calls.push({ url: String(url), init: init as RequestInit });
        return new Response(JSON.stringify(body), { status });
    }
    globalThis.fetch = fetchStubbedResponse as unknown as typeof fetch;
}

async function validateRequestIsAPostWithBearerKeyModelStateAndQuestions() {
    const calls: FetchCall[] = [];
    setFetchStub(calls, 200, getSubqBody());
    await createSubqClient('subq-key').systemOne({ state: getHardCodedState(), questions: getHardCodedQuestions() });
    expect(calls.length).toBe(1);
    expect(calls[0].url).toBe('https://api.subq.ai/v1/systemone');
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.headers).toEqual({ Authorization: 'Bearer subq-key', 'Content-Type': 'application/json' });
    expect(JSON.parse(calls[0].init.body as string)).toEqual({ model: 'subq-snap-1.2', state: getHardCodedState(), questions: getHardCodedQuestions() });
}

async function validateResponseBodyIsReturnedInTheTypeSafeOutputShape() {
    setFetchStub([], 200, getSubqBody());
    const output = await createSubqClient('subq-key').systemOne({ state: getHardCodedState(), questions: getHardCodedQuestions() });
    expect(output).toEqual(getSubqBody() as never);
}

async function validateErrorStatusThrowsWithTypeAndMessage() {
    setFetchStub([], 402, { detail: { error_type: 'insufficient_credits', message: 'The organization is out of credits.' } });
    const run = createSubqClient('subq-key').systemOne({ state: getHardCodedState(), questions: getHardCodedQuestions() });
    await expect(run).rejects.toThrow('SubQ 402 insufficient_credits: The organization is out of credits.');
}

function registerSubqClientTests() {
    const realFetch = globalThis.fetch;
    function resetFetch() {
        globalThis.fetch = realFetch;
    }
    afterEach(resetFetch);
    test('test_subq_request_is_a_post_with_bearer_key_model_state_and_questions', validateRequestIsAPostWithBearerKeyModelStateAndQuestions);
    test('test_subq_response_body_is_returned_in_the_typesafe_output_shape', validateResponseBodyIsReturnedInTheTypeSafeOutputShape);
    test('test_subq_error_status_throws_with_type_and_message', validateErrorStatusThrowsWithTypeAndMessage);
}

describe('subq client', registerSubqClientTests);
