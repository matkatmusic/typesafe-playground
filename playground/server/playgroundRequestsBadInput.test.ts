import { test, expect } from 'bun:test';
import { executeRunRequest, isCallsInRange } from './playgroundRequests';
import { loadHistory } from '../history/playgroundHistory';
import { buildTempHistoryPath, createRunRequest, createStubFactory, type Call } from './playgroundRequestsSupport';

function validateCallsRangeIsOneToTen() {
    const candidateCalls = [0, 1, 10, 11, 1.5, '2', null];
    const rangeResults: boolean[] = [];
    for (const candidateCall of candidateCalls) {
        rangeResults.push(isCallsInRange(candidateCall));
    }
    expect(rangeResults).toEqual([false, true, true, false, false, false, false]);
}

async function validateBadCallsReturn400WithoutCallingTheClient() {
    Bun.env.TYPESAFE_API_KEY = 'env-key';
    const calls: Call[] = [];
    const historyPath = await buildTempHistoryPath();
    const factory = createStubFactory(calls);
    expect((await executeRunRequest(createRunRequest({}), factory, historyPath)).status).toBe(400);
    expect((await executeRunRequest(createRunRequest({ calls: 0 }), factory, historyPath)).status).toBe(400);
    expect((await executeRunRequest(createRunRequest({ calls: 11 }), factory, historyPath)).status).toBe(400);
    expect((await executeRunRequest(createRunRequest({ calls: 1.5 }), factory, historyPath)).status).toBe(400);
    expect((await executeRunRequest(createRunRequest({ calls: '2' }), factory, historyPath)).status).toBe(400);
    expect(calls.length).toBe(0);
}

async function validateBadIndexReturns400WithoutCallingTheClient() {
    Bun.env.TYPESAFE_API_KEY = 'env-key';
    const calls: Call[] = [];
    const historyPath = await buildTempHistoryPath();
    const factory = createStubFactory(calls);
    for (const badIndex of [undefined, 99, -1, '0', 1.5, null]) {
        const response = await executeRunRequest(createRunRequest({ calls: 1, index: badIndex }), factory, historyPath);
        expect(response.status).toBe(400);
        expect(await response.text()).toBe('index must be the integer index of an existing version');
    }
    expect(calls.length).toBe(0);
    expect((await loadHistory(historyPath)).length).toBe(1);
}

test('test_calls_range_is_one_to_ten', validateCallsRangeIsOneToTen);
test('test_run_with_bad_calls_returns_400_and_makes_no_call', validateBadCallsReturn400WithoutCallingTheClient);
test('test_run_with_a_bad_index_returns_400_and_makes_no_call', validateBadIndexReturns400WithoutCallingTheClient);
