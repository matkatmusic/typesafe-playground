import { test, expect } from 'bun:test';
import type { JsonValue } from '@typesafe-ai/sdk';
import { buildBatchVersions } from '../client/batch/batchPlan';
import { dispatchRequest } from './playground';
import { loadHistory, type Version } from '../history/playgroundHistory';
import { getNotRunTime } from '../history/notRunTime';
import { getHardCodedQuestions } from '../providers/typeSafeQuery';
import { buildCountingClientFactory, buildPost, buildTempHistoryPath, getPort } from './playgroundBatchRunSupport';

function buildRunBodies(plan: ReturnType<typeof buildBatchVersions>, states: Record<string, JsonValue>[]) {
    const runBodies: unknown[] = [];
    for (let i = 0; i < states.length; i++)
        runBodies.push({ index: plan.itemIndexes[i], calls: 3, apiKey: 'typed', state: states[i], questions: getHardCodedQuestions() });
    return runBodies;
}

function assertFirstVersionHasNoResultsAndSecondHasThree(history: Version[]) {
    expect(history[0].outputs.length).toBe(0);
    expect(history[0].calls).toBe(0);
    expect(history[0].time).toBe(getNotRunTime());
    expect(history[1].outputs.length).toBe(3);
}

async function validateOneFailedCallInsideARunLosesTheEarlierPaidCallsOfThatRun() {
    // Step: the fake client fails on its 2nd call, which is inside the first run of 3 calls.
    const historyPath = await buildTempHistoryPath();
    const { seenStates, createClient } = buildCountingClientFactory(2);
    const states = [{ a: 1 }, { a: 2 }];
    const plan = buildBatchVersions(await loadHistory(historyPath), 0, states, getHardCodedQuestions());
    await dispatchRequest(buildPost('/open', { versions: plan.versions }), getPort(), historyPath, createClient as never);
    const runBodies = buildRunBodies(plan, states);
    // Step: the first run throws (the real server turns this into a 500) and the second run still works.
    await expect(dispatchRequest(buildPost('/run', runBodies[0]), getPort(), historyPath, createClient as never)).rejects.toThrow('call failed');
    const secondResponse = await dispatchRequest(buildPost('/run', runBodies[1]), getPort(), historyPath, createClient as never);
    expect(secondResponse.status).toBe(200);
    // Step: the 1 successful call is not stored: version 1 has no results or run time.
    expect(seenStates.length).toBe(5);
    assertFirstVersionHasNoResultsAndSecondHasThree(await loadHistory(historyPath));
}

test('test_one_failed_call_inside_a_run_loses_the_earlier_paid_calls_of_that_run', validateOneFailedCallInsideARunLosesTheEarlierPaidCallsOfThatRun);
