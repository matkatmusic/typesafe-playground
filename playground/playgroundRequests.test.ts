import { test, expect } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { NOT_RUN_TIME } from './notRunTime'
import { addRunToHistory, executeRunRequest, isCallsInRange, MISSING_KEY_MESSAGE, selectApiKey, type CreateRunClient } from './playgroundRequests'
import { initHistory, loadHistory, type RunOutput } from './playgroundHistory'
import type { RunResult } from './client/types'
import { hideKeysInMessage } from './serverErrors'
import { HARD_CODED_QUESTIONS, HARD_CODED_STATE } from './typeSafeQuery'

type Call = { apiKey: string; request: unknown }

const OUTPUT = { answers: {}, usage: { input_tokens: 5, output_tokens: 1 } } as unknown as RunOutput

async function buildTempHistoryPath() {
    const historyPath = `${mkdtempSync(`${tmpdir()}/playground-run-`)}/results/playground-history.json`
    await initHistory(historyPath)
    return historyPath
}

function makeStubFactory(calls: Call[]): CreateRunClient {
    function createStubClient(apiKey: string) {
        async function stubSystemOne(request: unknown) {
            calls.push({ apiKey, request })
            return OUTPUT
        }
        return { systemOne: stubSystemOne }
    }
    return createStubClient
}

function makeRunRequest(body: unknown): Request {
    return new Request('http://127.0.0.1:4399/run', { method: 'POST', body: JSON.stringify({ index: 0, state: {}, questions: HARD_CODED_QUESTIONS, ...(body as object) }) })
}

function validateTypedKeyBeatsEnvKey() {
    expect(selectApiKey('typed', 'env')).toBe('typed')
    expect(selectApiKey('', 'env')).toBe('env')
    expect(selectApiKey('', '')).toBe('')
}

function validateCallsRangeIsOneToTen() {
    expect([0, 1, 10, 11, 1.5, '2', null].map(isCallsInRange)).toEqual([false, true, true, false, false, false, false])
}

async function validateTypedKeyIsUsedOverEnvKey() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const calls: Call[] = []
    const response = await executeRunRequest(makeRunRequest({ calls: 1, apiKey: '  typed-key ' }), makeStubFactory(calls), await buildTempHistoryPath())
    expect(response.status).toBe(200)
    expect(calls.length).toBe(1)
    expect(calls[0].apiKey).toBe('typed-key')
}

async function validateEnvKeyIsUsedWhenNothingIsTyped() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const calls: Call[] = []
    const historyPath = await buildTempHistoryPath()
    await executeRunRequest(makeRunRequest({ calls: 1, apiKey: '' }), makeStubFactory(calls), historyPath)
    expect(calls[0].apiKey).toBe('env-key')
    await executeRunRequest(makeRunRequest({ calls: 1 }), makeStubFactory(calls), historyPath)
    expect(calls[1].apiKey).toBe('env-key')
}

async function validateNoKeyReturns400WithoutCallingTheClient() {
    Bun.env.TYPESAFE_API_KEY = ''
    const calls: Call[] = []
    const response = await executeRunRequest(makeRunRequest({ calls: 1, apiKey: '   ' }), makeStubFactory(calls), await buildTempHistoryPath())
    expect(response.status).toBe(400)
    expect(await response.text()).toBe(MISSING_KEY_MESSAGE)
    expect(MISSING_KEY_MESSAGE).toBe('Add a TypeSafe API key')
    expect(calls.length).toBe(0)
}

async function validateBadCallsReturn400WithoutCallingTheClient() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const calls: Call[] = []
    const historyPath = await buildTempHistoryPath()
    const factory = makeStubFactory(calls)
    expect((await executeRunRequest(makeRunRequest({}), factory, historyPath)).status).toBe(400)
    expect((await executeRunRequest(makeRunRequest({ calls: 0 }), factory, historyPath)).status).toBe(400)
    expect((await executeRunRequest(makeRunRequest({ calls: 11 }), factory, historyPath)).status).toBe(400)
    expect((await executeRunRequest(makeRunRequest({ calls: 1.5 }), factory, historyPath)).status).toBe(400)
    expect((await executeRunRequest(makeRunRequest({ calls: '2' }), factory, historyPath)).status).toBe(400)
    expect(calls.length).toBe(0)
}

async function validateBadIndexReturns400WithoutCallingTheClient() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const calls: Call[] = []
    const historyPath = await buildTempHistoryPath()
    const factory = makeStubFactory(calls)
    for (const badIndex of [undefined, 99, -1, '0', 1.5, null]) {
        const response = await executeRunRequest(makeRunRequest({ calls: 1, index: badIndex }), factory, historyPath)
        expect(response.status).toBe(400)
        expect(await response.text()).toBe('index must be the integer index of an existing version')
    }
    expect(calls.length).toBe(0)
    expect((await loadHistory(historyPath)).length).toBe(1)
}

async function validateClientReceivesTheTypedStateAndQuestionsOncePerCall() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const calls: Call[] = []
    const typedState = { text: 'typed' }
    const typedQuestions = { other: HARD_CODED_QUESTIONS.requestsAction }
    await executeRunRequest(makeRunRequest({ calls: 3, state: typedState, questions: typedQuestions }), makeStubFactory(calls), await buildTempHistoryPath())
    expect(calls.length).toBe(3)
    for (const call of calls)
        expect(call.request).toEqual({ state: typedState, questions: typedQuestions })
}

async function validateRunAppendsToTheLastVersionAndRespondsWithOutputsAndVersion() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const historyPath = await buildTempHistoryPath()
    const factory = makeStubFactory([])
    const first = (await (await executeRunRequest(makeRunRequest({ calls: 2, state: HARD_CODED_STATE }), factory, historyPath)).json()) as RunResult
    expect(first.outputs).toEqual([OUTPUT, OUTPUT])
    expect(first.index).toBe(0)
    expect(first.version.calls).toBe(2)
    const second = (await (await executeRunRequest(makeRunRequest({ calls: 3, state: HARD_CODED_STATE }), factory, historyPath)).json()) as RunResult
    expect(second.outputs.length).toBe(3)
    expect(second.version.calls).toBe(5)
    expect(second.version.outputs.length).toBe(5)
    const history = await loadHistory(historyPath)
    expect(history.length).toBe(1)
    expect(history[0]).toEqual(second.version)
}

async function validateTypedKeyIsHiddenInLaterErrorMessages() {
    Bun.env.TYPESAFE_API_KEY = ''
    await executeRunRequest(makeRunRequest({ calls: 1, apiKey: 'typed-secret-789' }), makeStubFactory([]), await buildTempHistoryPath())
    expect(hideKeysInMessage('failed with typed-secret-789')).toBe('failed with [key hidden]')
}

test('test_typed_key_beats_env_key', validateTypedKeyBeatsEnvKey)
test('test_calls_range_is_one_to_ten', validateCallsRangeIsOneToTen)
test('test_run_uses_typed_key_over_env_key', validateTypedKeyIsUsedOverEnvKey)
test('test_run_uses_env_key_when_nothing_is_typed', validateEnvKeyIsUsedWhenNothingIsTyped)
test('test_run_with_no_key_returns_400_and_makes_no_call', validateNoKeyReturns400WithoutCallingTheClient)
test('test_run_with_bad_calls_returns_400_and_makes_no_call', validateBadCallsReturn400WithoutCallingTheClient)
test('test_run_with_a_bad_index_returns_400_and_makes_no_call', validateBadIndexReturns400WithoutCallingTheClient)
test('test_run_sends_the_typed_state_and_questions_once_per_call', validateClientReceivesTheTypedStateAndQuestionsOncePerCall)
test('test_run_appends_to_the_last_version_and_responds_with_outputs_and_version', validateRunAppendsToTheLastVersionAndRespondsWithOutputsAndVersion)
test('test_run_remembers_typed_key_for_error_scrubbing', validateTypedKeyIsHiddenInLaterErrorMessages)

function buildShownWithTime(time: string) {
    return { time, state: HARD_CODED_STATE, questions: HARD_CODED_QUESTIONS, calls: 0, outputs: [] as RunOutput[] }
}

function validateKeepStampsARealTimeOnANotRunVersion() {
    const shown = buildShownWithTime(NOT_RUN_TIME)
    addRunToHistory([shown], shown, [OUTPUT], HARD_CODED_STATE, HARD_CODED_QUESTIONS)
    expect(shown.time).not.toBe(NOT_RUN_TIME)
    expect(Number.isNaN(new Date(shown.time).getTime())).toBe(false)
}

function validateOverwriteStampsARealTimeOnANotRunVersion() {
    const shown = buildShownWithTime(NOT_RUN_TIME)
    addRunToHistory([shown], shown, [OUTPUT], { message: { text: 'edited' } }, HARD_CODED_QUESTIONS)
    expect(shown.state).toEqual({ message: { text: 'edited' } })
    expect(Number.isNaN(new Date(shown.time).getTime())).toBe(false)
}

function validateARealTimeIsKeptOnLaterRuns() {
    const shown = buildShownWithTime('2026-01-02T03:04:05.000Z')
    addRunToHistory([shown], shown, [OUTPUT], HARD_CODED_STATE, HARD_CODED_QUESTIONS)
    expect(shown.time).toBe('2026-01-02T03:04:05.000Z')
}

test('test_keep_stamps_a_real_time_on_a_not_run_version', validateKeepStampsARealTimeOnANotRunVersion)
test('test_overwrite_stamps_a_real_time_on_a_not_run_version', validateOverwriteStampsARealTimeOnANotRunVersion)
test('test_a_real_time_is_kept_on_later_runs', validateARealTimeIsKeptOnLaterRuns)
