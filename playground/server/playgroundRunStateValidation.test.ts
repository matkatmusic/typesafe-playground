import { test, expect } from 'bun:test';
import { executeRunRequest } from './playgroundRequests';
import { buildTempHistoryPath, createRunRequest, createStubFactory } from './playgroundRunStateSupport';

async function validateStateThatIsNotAnObjectReturns400WithoutCallingTheClient() {
    Bun.env.TYPESAFE_API_KEY = 'env-key';
    const seenKeys: string[] = [];
    for (const badState of [undefined, 'text', [1], null]) {
        const response = await executeRunRequest(createRunRequest(badState), createStubFactory(seenKeys), await buildTempHistoryPath());
        expect(response.status).toBe(400);
        expect(await response.text()).toBe('state must be a JSON object');
    }
    expect(seenKeys).toEqual([]);
}

async function validateQuestionsThatAreNotAnObjectReturn400WithoutCallingTheClient() {
    Bun.env.TYPESAFE_API_KEY = 'env-key';
    const seenKeys: string[] = [];
    const missingQuestionsRequest = new Request('http://127.0.0.1:4399/run', { method: 'POST', body: JSON.stringify({ index: 0, calls: 1, state: {} }) });
    const requests = [missingQuestionsRequest, createRunRequest({}, 0, 'text'), createRunRequest({}, 0, [1]), createRunRequest({}, 0, null)];
    for (const request of requests) {
        const response = await executeRunRequest(request, createStubFactory(seenKeys), await buildTempHistoryPath());
        expect(response.status).toBe(400);
        expect(await response.text()).toBe('questions must be a JSON object');
    }
    expect(seenKeys).toEqual([]);
}

test('test_state_that_is_not_an_object_returns_400_and_makes_no_call', validateStateThatIsNotAnObjectReturns400WithoutCallingTheClient);
test('test_questions_that_are_not_an_object_return_400_and_make_no_call', validateQuestionsThatAreNotAnObjectReturn400WithoutCallingTheClient);
