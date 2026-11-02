import { test, expect } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { buildBatchVersions } from './client/batchPlan'
import { dispatchRequest } from './playground'
import { initHistory, loadHistory, type RunOutput, type Version } from './playgroundHistory'
import { NOT_RUN_TIME } from './notRunTime'
import { HARD_CODED_QUESTIONS } from './typeSafeQuery'

const PORT = 4323
const ALLOWED_HOST = `127.0.0.1:${PORT}`
const HEADERS = { host: ALLOWED_HOST, origin: `http://${ALLOWED_HOST}`, 'content-type': 'application/json' }

async function buildTempHistoryPath() {
    const historyPath = `${mkdtempSync(`${tmpdir()}/playground-batch-test-`)}/results/playground-history.json`
    await initHistory(historyPath)
    return historyPath
}

function buildPost(path: string, body: unknown) {
    return new Request(`http://${ALLOWED_HOST}${path}`, { method: 'POST', headers: HEADERS, body: JSON.stringify(body) })
}

function buildCountingClientFactory(failOnCall: number | null) {
    const seenStates: unknown[] = []
    const output = { answers: {}, usage: { input_tokens: 7, output_tokens: 1 } } as unknown as RunOutput
    async function systemOne(request: { state: unknown }) {
        seenStates.push(request.state)
        if (seenStates.length === failOnCall)
            throw new Error('call failed')
        return output
    }
    return { seenStates, createClient: () => ({ systemOne }) }
}

async function openBatchAndRunEachItem(historyPath: string, shownIndex: number, states: unknown[], questions: unknown, createClient: () => { systemOne: (request: never) => Promise<RunOutput> }) {
    const history = await loadHistory(historyPath)
    const plan = buildBatchVersions(history, shownIndex, states, questions)
    const openResponse = await dispatchRequest(buildPost('/open', { versions: plan.versions }), PORT, historyPath, createClient as never)
    expect(openResponse.status).toBe(200)
    const responses: Response[] = []
    for (let i = 0; i < states.length; i++) {
        const body = { index: plan.itemIndexes[i], calls: 3, apiKey: 'typed', state: states[i], questions }
        responses.push(await dispatchRequest(buildPost('/run', body), PORT, historyPath, createClient as never))
    }
    return { plan, responses }
}

async function validateFiveStatesWithCallsThreeMakeFifteenClientCallsOnTheirOwnVersions() {
    // Step: a new document has one unrun default version, the batch has 5 states, each run has 3 calls.
    const historyPath = await buildTempHistoryPath()
    const { seenStates, createClient } = buildCountingClientFactory(null)
    const states = [{ a: 1 }, { a: 2 }, { a: 3 }, { a: 4 }, { a: 5 }]
    const { plan, responses } = await openBatchAndRunEachItem(historyPath, 0, states, HARD_CODED_QUESTIONS, createClient)
    // Step: the first item overwrote version 1, the other 4 items are versions 2 to 5.
    expect(plan.itemIndexes).toEqual([0, 1, 2, 3, 4])
    for (const response of responses)
        expect(response.status).toBe(200)
    // Step: the fake client got 15 calls, 3 for each state, in array order.
    expect(seenStates.length).toBe(15)
    expect(seenStates).toEqual(states.flatMap((state) => [state, state, state]))
    // Step: every version stores its own 3 outputs and a run time, and no extra version was made.
    const history = await loadHistory(historyPath)
    expect(history.length).toBe(5)
    for (let i = 0; i < 5; i++) {
        expect(history[i].state).toEqual(states[i])
        expect(history[i].calls).toBe(3)
        expect(history[i].outputs.length).toBe(3)
        expect(history[i].time).not.toBe(NOT_RUN_TIME)
    }
}

async function validateVersionFourExampleAddsResultsToVersionFourAndStampsVersionFive() {
    // Step: write 4 versions, version 4 holds results and the state {"a":1}.
    const historyPath = await buildTempHistoryPath()
    const output = { answers: {}, usage: { input_tokens: 7, output_tokens: 1 } }
    const questions = { q: { type: 'noul', instructions: 'x' } }
    const versions: Version[] = []
    for (let i = 0; i < 3; i++)
        versions.push({ time: 't', state: { z: i }, questions, calls: 1, outputs: [output as never] })
    versions.push({ time: 'old time', state: { a: 1 }, questions, calls: 1, outputs: [output as never] })
    await dispatchRequest(buildPost('/open', { versions }), PORT, historyPath)
    const { createClient } = buildCountingClientFactory(null)
    const { plan } = await openBatchAndRunEachItem(historyPath, 3, [{ a: 1 }, { a: 2 }], questions, createClient)
    expect(plan.itemIndexes).toEqual([3, 4])
    const history = await loadHistory(historyPath)
    // Step: version 4 now has 1 old + 3 new outputs and keeps its old time.
    expect(history.length).toBe(5)
    expect(history[3].calls).toBe(4)
    expect(history[3].outputs.length).toBe(4)
    expect(history[3].time).toBe('old time')
    // Step: version 5 has 3 outputs and a new run time.
    expect(history[4].state).toEqual({ a: 2 })
    expect(history[4].calls).toBe(3)
    expect(history[4].time).not.toBe(NOT_RUN_TIME)
}

async function validateOneFailedCallInsideARunLosesTheEarlierPaidCallsOfThatRun() {
    // Step: the fake client fails on its 2nd call, which is inside the first run of 3 calls.
    const historyPath = await buildTempHistoryPath()
    const { seenStates, createClient } = buildCountingClientFactory(2)
    const states = [{ a: 1 }, { a: 2 }]
    const plan = buildBatchVersions(await loadHistory(historyPath), 0, states, HARD_CODED_QUESTIONS)
    await dispatchRequest(buildPost('/open', { versions: plan.versions }), PORT, historyPath, createClient as never)
    const runBodies = states.map((state, i) => ({ index: plan.itemIndexes[i], calls: 3, apiKey: 'typed', state, questions: HARD_CODED_QUESTIONS }))
    // Step: the first run throws (the real server turns this into a 500) and the second run still works.
    await expect(dispatchRequest(buildPost('/run', runBodies[0]), PORT, historyPath, createClient as never)).rejects.toThrow('call failed')
    const secondResponse = await dispatchRequest(buildPost('/run', runBodies[1]), PORT, historyPath, createClient as never)
    expect(secondResponse.status).toBe(200)
    // Step: the 1 call that worked before the failure is not stored: version 1 has no results and still has no run time.
    expect(seenStates.length).toBe(5)
    const history = await loadHistory(historyPath)
    expect(history[0].outputs.length).toBe(0)
    expect(history[0].calls).toBe(0)
    expect(history[0].time).toBe(NOT_RUN_TIME)
    expect(history[1].outputs.length).toBe(3)
}

test('test_five_states_with_calls_three_make_fifteen_client_calls_on_their_own_versions', validateFiveStatesWithCallsThreeMakeFifteenClientCallsOnTheirOwnVersions)
test('test_version_four_example_adds_results_to_version_four_and_stamps_version_five', validateVersionFourExampleAddsResultsToVersionFourAndStampsVersionFive)
test('test_one_failed_call_inside_a_run_loses_the_earlier_paid_calls_of_that_run', validateOneFailedCallInsideARunLosesTheEarlierPaidCallsOfThatRun)
