import { test, expect } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { executeRunRequest, type CreateRunClient } from './playgroundRequests'
import { initHistory, loadHistory, writeHistory, type RunOutput, type Version } from './playgroundHistory'
import { HARD_CODED_QUESTIONS } from './typeSafeQuery'

const OUTPUT = { answers: {}, usage: { input_tokens: 5, output_tokens: 1 } } as unknown as RunOutput

async function buildTempHistoryPath() {
    const historyPath = `${mkdtempSync(`${tmpdir()}/playground-run-state-`)}/results/playground-history.json`
    await initHistory(historyPath)
    return historyPath
}

function makeStubFactory(seenKeys: string[]): CreateRunClient {
    function createStubClient(apiKey: string) {
        async function stubSystemOne() {
            seenKeys.push(apiKey)
            return OUTPUT
        }
        return { systemOne: stubSystemOne }
    }
    return createStubClient
}

function makeRunRequest(state: unknown, id = 1, questions: unknown = HARD_CODED_QUESTIONS): Request {
    return new Request('http://127.0.0.1:4399/run', { method: 'POST', body: JSON.stringify({ id: id, calls: 1, state: state, questions: questions }) })
}

async function buildFourVersionHistoryPath() {
    const historyPath = await buildTempHistoryPath()
    const versions: Version[] = []
    for (let id = 1; id <= 4; id++)
        versions.push({ id: id, time: `t${id}`, state: { v: id }, questions: HARD_CODED_QUESTIONS, calls: 0, outputs: [] })
    await writeHistory(historyPath, versions)
    return historyPath
}

async function validateStateThatIsNotAnObjectReturns400WithoutCallingTheClient() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const seenKeys: string[] = []
    for (const badState of [undefined, 'text', [1], null]) {
        const response = await executeRunRequest(makeRunRequest(badState), makeStubFactory(seenKeys), await buildTempHistoryPath())
        expect(response.status).toBe(400)
        expect(await response.text()).toBe('state must be a JSON object')
    }
    expect(seenKeys).toEqual([])
}

async function validateQuestionsThatAreNotAnObjectReturn400WithoutCallingTheClient() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const seenKeys: string[] = []
    const missingQuestionsRequest = new Request('http://127.0.0.1:4399/run', { method: 'POST', body: JSON.stringify({ id: 1, calls: 1, state: {} }) })
    const requests = [missingQuestionsRequest, makeRunRequest({}, 1, 'text'), makeRunRequest({}, 1, [1]), makeRunRequest({}, 1, null)]
    for (const request of requests) {
        const response = await executeRunRequest(request, makeStubFactory(seenKeys), await buildTempHistoryPath())
        expect(response.status).toBe(400)
        expect(await response.text()).toBe('questions must be a JSON object')
    }
    expect(seenKeys).toEqual([])
}

async function validateChangedQuestionsMakeANewVersionAndSameQuestionsAppend() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const historyPath = await buildFourVersionHistoryPath()
    const factory = makeStubFactory([])
    const changedQuestions = { other: HARD_CODED_QUESTIONS.requestsAction }
    const first = (await (await executeRunRequest(makeRunRequest({ v: 4 }, 4, changedQuestions), factory, historyPath)).json()) as { version: Version }
    expect(first.version.id).toBe(5)
    expect(first.version.questions).toEqual(changedQuestions)
    const second = (await (await executeRunRequest(makeRunRequest({ v: 4 }, 5, changedQuestions), factory, historyPath)).json()) as { version: Version }
    expect(second.version.id).toBe(5)
    expect(second.version.calls).toBe(2)
    const history = await loadHistory(historyPath)
    expect(history.length).toBe(5)
    expect(history[3].outputs).toEqual([])
}

async function validateChangedStateMakesANewVersionAndSameStateAppends() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const historyPath = await buildTempHistoryPath()
    const factory = makeStubFactory([])
    const first = (await (await executeRunRequest(makeRunRequest({ a: 1 }), factory, historyPath)).json()) as { version: Version }
    expect(first.version.id).toBe(2)
    const second = (await (await executeRunRequest(makeRunRequest({ a: 1 }, 2), factory, historyPath)).json()) as { version: Version }
    expect(second.version.id).toBe(2)
    expect(second.version.calls).toBe(2)
    const third = (await (await executeRunRequest(makeRunRequest({ a: 2 }, 2), factory, historyPath)).json()) as { version: Version }
    expect(third.version.id).toBe(3)
    const history = await loadHistory(historyPath)
    expect(history.length).toBe(3)
    expect(history[0].outputs).toEqual([])
    expect(history[1].state).toEqual({ a: 1 })
}

async function validateUnchangedInputAppendsToTheShownVersionNotTheLast() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const historyPath = await buildFourVersionHistoryPath()
    const response = await executeRunRequest(makeRunRequest({ v: 2 }, 2), makeStubFactory([]), historyPath)
    const result = (await response.json()) as { version: Version }
    expect(result.version.id).toBe(2)
    expect(result.version.calls).toBe(1)
    const history = await loadHistory(historyPath)
    expect(history.length).toBe(4)
    expect(history[1].outputs.length).toBe(1)
    expect(history[3].outputs).toEqual([])
}

async function validateChangedInputOnAnEarlierVersionPushesAtTheEnd() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const historyPath = await buildFourVersionHistoryPath()
    const response = await executeRunRequest(makeRunRequest({ v: 'edited' }, 2), makeStubFactory([]), historyPath)
    const result = (await response.json()) as { version: Version }
    expect(result.version.id).toBe(5)
    const history = await loadHistory(historyPath)
    expect(history.length).toBe(5)
    expect(history[4].state).toEqual({ v: 'edited' })
    expect(history[1].outputs).toEqual([])
}

async function validateStateEqualToTheLastButNotTheShownVersionPushesANewVersion() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const historyPath = await buildFourVersionHistoryPath()
    const response = await executeRunRequest(makeRunRequest({ v: 4 }, 2), makeStubFactory([]), historyPath)
    const result = (await response.json()) as { version: Version }
    expect(result.version.id).toBe(5)
    expect((await loadHistory(historyPath))[3].outputs).toEqual([])
}

test('test_state_that_is_not_an_object_returns_400_and_makes_no_call', validateStateThatIsNotAnObjectReturns400WithoutCallingTheClient)
test('test_questions_that_are_not_an_object_return_400_and_make_no_call', validateQuestionsThatAreNotAnObjectReturn400WithoutCallingTheClient)
test('test_changed_questions_make_a_new_version_and_same_questions_append', validateChangedQuestionsMakeANewVersionAndSameQuestionsAppend)
test('test_unchanged_input_appends_to_the_shown_version_not_the_last',validateUnchangedInputAppendsToTheShownVersionNotTheLast)
test('test_changed_input_on_an_earlier_version_pushes_at_the_end', validateChangedInputOnAnEarlierVersionPushesAtTheEnd)
test('test_state_equal_to_the_last_but_not_the_shown_version_pushes_a_new_version', validateStateEqualToTheLastButNotTheShownVersionPushesANewVersion)
test('test_changed_state_makes_a_new_version_and_same_state_appends', validateChangedStateMakesANewVersionAndSameStateAppends)
