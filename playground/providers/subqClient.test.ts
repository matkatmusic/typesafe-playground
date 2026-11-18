import { test, expect, afterEach } from 'bun:test';
import { createSubqClient, SUBQ_MODEL, SUBQ_SYSTEM_ONE_URL } from './subqClient';
import { HARD_CODED_QUESTIONS, HARD_CODED_STATE } from './typeSafeQuery';

const realFetch = globalThis.fetch;
const SUBQ_BODY = { model: 'subq-snap-1.2', answers: { requestsAction: { type: 'noul', noul: 0.9 } }, usage: { input_tokens: 7, output_tokens: 0 } };

type FetchCall = { url: string; init: RequestInit };

function stubFetch(calls: FetchCall[], status: number, body: unknown) {
  async function stubbedFetch(url: string | URL | Request, init?: RequestInit) {
    calls.push({ url: String(url), init: init as RequestInit });
    return new Response(JSON.stringify(body), { status });
  }
  globalThis.fetch = stubbedFetch as unknown as typeof fetch;
}

afterEach(() => {
  globalThis.fetch = realFetch;
});

async function validateRequestIsAPostWithBearerKeyModelStateAndQuestions() {
  const calls: FetchCall[] = [];
  stubFetch(calls, 200, SUBQ_BODY);
  await createSubqClient('subq-key').systemOne({ state: HARD_CODED_STATE, questions: HARD_CODED_QUESTIONS });
  expect(calls.length).toBe(1);
  expect(calls[0].url).toBe(SUBQ_SYSTEM_ONE_URL);
  expect(calls[0].url).toBe('https://api.subq.ai/v1/systemone');
  expect(calls[0].init.method).toBe('POST');
  expect(calls[0].init.headers).toEqual({ Authorization: 'Bearer subq-key', 'Content-Type': 'application/json' });
  expect(JSON.parse(calls[0].init.body as string)).toEqual({ model: SUBQ_MODEL, state: HARD_CODED_STATE, questions: HARD_CODED_QUESTIONS });
  expect(SUBQ_MODEL).toBe('subq-snap-1.2');
}

async function validateResponseBodyIsReturnedInTheTypeSafeOutputShape() {
  stubFetch([], 200, SUBQ_BODY);
  const output = await createSubqClient('subq-key').systemOne({ state: HARD_CODED_STATE, questions: HARD_CODED_QUESTIONS });
  expect(output).toEqual(SUBQ_BODY as never);
}

async function validateErrorStatusThrowsWithTypeAndMessage() {
  stubFetch([], 402, { detail: { error_type: 'insufficient_credits', message: 'The organization is out of credits.' } });
  const run = createSubqClient('subq-key').systemOne({ state: HARD_CODED_STATE, questions: HARD_CODED_QUESTIONS });
  await expect(run).rejects.toThrow('SubQ 402 insufficient_credits: The organization is out of credits.');
}

test('test_subq_request_is_a_post_with_bearer_key_model_state_and_questions', validateRequestIsAPostWithBearerKeyModelStateAndQuestions);
test('test_subq_response_body_is_returned_in_the_typesafe_output_shape', validateResponseBodyIsReturnedInTheTypeSafeOutputShape);
test('test_subq_error_status_throws_with_type_and_message', validateErrorStatusThrowsWithTypeAndMessage);
