import { test, expect } from 'bun:test';
import type { JsonValue } from '@typesafe-ai/sdk';
import { loadHistory, type Version } from '../history/playgroundHistory';
import { getNotRunTime } from '../history/notRunTime';
import { getHardCodedQuestions } from '../providers/typeSafeQuery';
import { buildCountingClientFactory, buildTempHistoryPath, openBatchAndRunEachItem } from './playgroundBatchRunSupport';

function assertEveryResponseIsOk(responses: Response[]) {
    for (const response of responses)
        expect(response.status).toBe(200);
}

function collectEachStateThreeTimes(states: Record<string, JsonValue>[]) {
    const repeatedStates: unknown[] = [];
    for (const state of states)
        repeatedStates.push(state, state, state);
    return repeatedStates;
}

function assertEveryVersionStoresItsOwnThreeOutputs(history: Version[], states: Record<string, JsonValue>[]) {
    for (let i = 0; i < 5; i++) {
        expect(history[i].state).toEqual(states[i]);
        expect(history[i].calls).toBe(3);
        expect(history[i].outputs.length).toBe(3);
        expect(history[i].time).not.toBe(getNotRunTime());
    }
}

async function validateFiveStatesWithCallsThreeMakeFifteenClientCallsOnTheirOwnVersions() {
    // Step: a new document has one unrun default version, the batch has 5 states, each run has 3 calls.
    const historyPath = await buildTempHistoryPath();
    const { seenStates, createClient } = buildCountingClientFactory(null);
    const states = [{ a: 1 }, { a: 2 }, { a: 3 }, { a: 4 }, { a: 5 }];
    const { plan, responses } = await openBatchAndRunEachItem(historyPath, 0, states, getHardCodedQuestions(), createClient);
    // Step: the first item overwrote version 1, the other 4 items are versions 2 to 5.
    expect(plan.itemIndexes).toEqual([0, 1, 2, 3, 4]);
    assertEveryResponseIsOk(responses);
    // Step: the fake client got 15 calls, 3 for each state, in array order.
    expect(seenStates.length).toBe(15);
    expect(seenStates).toEqual(collectEachStateThreeTimes(states));
    // Step: every version stores its own 3 outputs and a run time, and no extra version was made.
    const history = await loadHistory(historyPath);
    expect(history.length).toBe(5);
    assertEveryVersionStoresItsOwnThreeOutputs(history, states);
}

test('test_five_states_with_calls_three_make_fifteen_client_calls_on_their_own_versions', validateFiveStatesWithCallsThreeMakeFifteenClientCallsOnTheirOwnVersions);
