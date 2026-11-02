import { test, expect } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { executeRunRequest, type CreateRunClient } from './playgroundRequests'
import { initHistory, loadHistory, writeHistory, type RunOutput, type Version } from './playgroundHistory'
import { HARD_CODED_QUESTIONS, HARD_CODED_STATE } from './typeSafeQuery'

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

function makeRunRequest(state: unknown, index = 0, questions: unknown = HARD_CODED_QUESTIONS): Request {
    return new Request('http://127.0.0.1:4399/run', { method: 'POST', body: JSON.stringify({ index: index, calls: 1, state: state, questions: questions }) })
}

async function buildFourVersionHistoryPath() {
    const historyPath = await buildTempHistoryPath()
    const versions: Version[] = []
    for (let number = 1; number <= 4; number++)
        versions.push({ time: `t${number}`, state: { v: number }, questions: HARD_CODED_QUESTIONS, calls: 1, outputs: [OUTPUT] })
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
    const missingQuestionsRequest = new Request('http://127.0.0.1:4399/run', { method: 'POST', body: JSON.stringify({ index: 0, calls: 1, state: {} }) })
    const requests = [missingQuestionsRequest, makeRunRequest({}, 0, 'text'), makeRunRequest({}, 0, [1]), makeRunRequest({}, 0, null)]
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
    const first = (await (await executeRunRequest(makeRunRequest({ v: 4 }, 3, changedQuestions), factory, historyPath)).json()) as { version: Version; index: number }
    expect(first.index).toBe(4)
    expect(first.version.questions).toEqual(changedQuestions)
    const second = (await (await executeRunRequest(makeRunRequest({ v: 4 }, 4, changedQuestions), factory, historyPath)).json()) as { version: Version; index: number }
    expect(second.index).toBe(4)
    expect(second.version.calls).toBe(2)
    const history = await loadHistory(historyPath)
    expect(history.length).toBe(5)
    expect(history[3].outputs).toEqual([OUTPUT])
}

async function validateChangedStateMakesANewVersionAndSameStateAppends() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const historyPath = await buildTempHistoryPath()
    const factory = makeStubFactory([])
    const first = (await (await executeRunRequest(makeRunRequest({ a: 1 }), factory, historyPath)).json()) as { version: Version; index: number }
    expect(first.index).toBe(0)
    const second = (await (await executeRunRequest(makeRunRequest({ a: 1 }, 0), factory, historyPath)).json()) as { version: Version; index: number }
    expect(second.index).toBe(0)
    expect(second.version.calls).toBe(2)
    const third = (await (await executeRunRequest(makeRunRequest({ a: 2 }, 0), factory, historyPath)).json()) as { version: Version; index: number }
    expect(third.index).toBe(1)
    const history = await loadHistory(historyPath)
    expect(history.length).toBe(2)
    expect(history[0].state).toEqual({ a: 1 })
    expect(history[1].state).toEqual({ a: 2 })
}

async function validateUnchangedInputAppendsToTheShownVersionNotTheLast() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const historyPath = await buildFourVersionHistoryPath()
    const response = await executeRunRequest(makeRunRequest({ v: 2 }, 1), makeStubFactory([]), historyPath)
    const result = (await response.json()) as { version: Version; index: number }
    expect(result.index).toBe(1)
    expect(result.version.calls).toBe(2)
    const history = await loadHistory(historyPath)
    expect(history.length).toBe(4)
    expect(history[1].outputs.length).toBe(2)
    expect(history[3].outputs.length).toBe(1)
}

async function validateChangedInputOnAnEarlierVersionPushesAtTheEnd() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const historyPath = await buildFourVersionHistoryPath()
    const response = await executeRunRequest(makeRunRequest({ v: 'edited' }, 1), makeStubFactory([]), historyPath)
    const result = (await response.json()) as { version: Version; index: number }
    expect(result.index).toBe(4)
    const history = await loadHistory(historyPath)
    expect(history.length).toBe(5)
    expect(history[4].state).toEqual({ v: 'edited' })
    expect(history[1].outputs).toEqual([OUTPUT])
}

async function validateStateEqualToTheLastButNotTheShownVersionPushesANewVersion() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const historyPath = await buildFourVersionHistoryPath()
    const response = await executeRunRequest(makeRunRequest({ v: 4 }, 1), makeStubFactory([]), historyPath)
    const result = (await response.json()) as { version: Version; index: number }
    expect(result.index).toBe(4)
    expect((await loadHistory(historyPath))[3].outputs).toEqual([OUTPUT])
}

async function validateOnlyVersionWithDefaultStateAndEditedQuestionsIsOverwrittenInPlace() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const historyPath = await buildTempHistoryPath()
    const editedQuestions = { other: HARD_CODED_QUESTIONS.requestsAction }
    const response = await executeRunRequest(makeRunRequest({ typed: 'edited' }, 0, editedQuestions), makeStubFactory([]), historyPath)
    const result = (await response.json()) as { version: Version; index: number }
    expect(result.index).toBe(0)
    const history = await loadHistory(historyPath)
    expect(history.length).toBe(1)
    expect(history[0].state).toEqual({ typed: 'edited' })
    expect(history[0].questions).toEqual(editedQuestions)
    expect(history[0].outputs).toEqual([OUTPUT])
}

async function validateVersionWithResultsAndChangedStateMakesASecondVersion() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const historyPath = await buildTempHistoryPath()
    const factory = makeStubFactory([])
    await executeRunRequest(makeRunRequest(HARD_CODED_STATE), factory, historyPath)
    const response = await executeRunRequest(makeRunRequest({ typed: 'changed' }), factory, historyPath)
    const result = (await response.json()) as { version: Version; index: number }
    expect(result.index).toBe(1)
    const history = await loadHistory(historyPath)
    expect(history.length).toBe(2)
    expect(history[0].outputs).toEqual([OUTPUT])
    expect(history[1].state).toEqual({ typed: 'changed' })
}

test('test_state_that_is_not_an_object_returns_400_and_makes_no_call', validateStateThatIsNotAnObjectReturns400WithoutCallingTheClient)
test('test_questions_that_are_not_an_object_return_400_and_make_no_call', validateQuestionsThatAreNotAnObjectReturn400WithoutCallingTheClient)
test('test_changed_questions_make_a_new_version_and_same_questions_append', validateChangedQuestionsMakeANewVersionAndSameQuestionsAppend)
test('test_unchanged_input_appends_to_the_shown_version_not_the_last',validateUnchangedInputAppendsToTheShownVersionNotTheLast)
test('test_changed_input_on_an_earlier_version_pushes_at_the_end', validateChangedInputOnAnEarlierVersionPushesAtTheEnd)
test('test_state_equal_to_the_last_but_not_the_shown_version_pushes_a_new_version', validateStateEqualToTheLastButNotTheShownVersionPushesANewVersion)
test('test_changed_state_makes_a_new_version_and_same_state_appends', validateChangedStateMakesANewVersionAndSameStateAppends)
test('test_only_version_with_default_state_and_edited_questions_is_overwritten_in_place', validateOnlyVersionWithDefaultStateAndEditedQuestionsIsOverwrittenInPlace)
test('test_version_with_results_and_changed_state_makes_a_second_version', validateVersionWithResultsAndChangedStateMakesASecondVersion)