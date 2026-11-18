import { test, expect } from 'bun:test';
import type { Questions } from '@typesafe-ai/sdk';
import { dispatchRequest } from './playground';
import { loadHistory, type Version } from '../history/playgroundHistory';
import { getNotRunTime } from '../history/notRunTime';
import { buildCountingClientFactory, buildPost, buildTempHistoryPath, getPort, openBatchAndRunEachItem } from './playgroundBatchRunSupport';

async function writeFourVersionsWhereVersionFourHoldsResults(historyPath: string, questions: Questions) {
    const output = { answers: {}, usage: { input_tokens: 7, output_tokens: 1 } };
    const versions: Version[] = [];
    for (let i = 0; i < 3; i++)
        versions.push({ time: 't', state: { z: i }, questions, calls: 1, outputs: [output as never] });
    versions.push({ time: 'old time', state: { a: 1 }, questions, calls: 1, outputs: [output as never] });
    await dispatchRequest(buildPost('/open', { versions }), getPort(), historyPath);
}

function assertVersionFourKeepsOldTimeAndVersionFiveIsStamped(history: Version[]) {
    // Step: version 4 now has 1 old + 3 new outputs and keeps its old time.
    expect(history.length).toBe(5);
    expect(history[3].calls).toBe(4);
    expect(history[3].outputs.length).toBe(4);
    expect(history[3].time).toBe('old time');
    // Step: version 5 has 3 outputs and a new run time.
    expect(history[4].state).toEqual({ a: 2 });
    expect(history[4].calls).toBe(3);
    expect(history[4].time).not.toBe(getNotRunTime());
}

async function validateVersionFourExampleAddsResultsToVersionFourAndStampsVersionFive() {
    // Step: write 4 versions, version 4 holds results and the state {"a":1}.
    const historyPath = await buildTempHistoryPath();
    const questions = { q: { type: 'noul', instructions: 'x' } } as unknown as Questions;
    await writeFourVersionsWhereVersionFourHoldsResults(historyPath, questions);
    const { createClient } = buildCountingClientFactory(null);
    const { plan } = await openBatchAndRunEachItem(historyPath, 3, [{ a: 1 }, { a: 2 }], questions, createClient);
    expect(plan.itemIndexes).toEqual([3, 4]);
    assertVersionFourKeepsOldTimeAndVersionFiveIsStamped(await loadHistory(historyPath));
}

test('test_version_four_example_adds_results_to_version_four_and_stamps_version_five', validateVersionFourExampleAddsResultsToVersionFourAndStampsVersionFive);
