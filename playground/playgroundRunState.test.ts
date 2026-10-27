import { test, expect } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { executeRunRequest, type CreateRunClient } from './playgroundRequests'
import { initHistory, loadHistory, type RunOutput, type Version } from './playgroundHistory'

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

function makeRunRequest(state: unknown): Request {
    return new Request('http://127.0.0.1:4399/run', { method: 'POST', body: JSON.stringify({ calls: 1, state: state }) })
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

async function validateChangedStateMakesANewVersionAndSameStateAppends() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const historyPath = await buildTempHistoryPath()
    const factory = makeStubFactory([])
    const first = (await (await executeRunRequest(makeRunRequest({ a: 1 }), factory, historyPath)).json()) as { version: Version }
    expect(first.version.id).toBe(2)
    const second = (await (await executeRunRequest(makeRunRequest({ a: 1 }), factory, historyPath)).json()) as { version: Version }
    expect(second.version.id).toBe(2)
    expect(second.version.calls).toBe(2)
    const third = (await (await executeRunRequest(makeRunRequest({ a: 2 }), factory, historyPath)).json()) as { version: Version }
    expect(third.version.id).toBe(3)
    const history = await loadHistory(historyPath)
    expect(history.length).toBe(3)
    expect(history[0].outputs).toEqual([])
    expect(history[1].state).toEqual({ a: 1 })
}

test('test_state_that_is_not_an_object_returns_400_and_makes_no_call', validateStateThatIsNotAnObjectReturns400WithoutCallingTheClient)
test('test_changed_state_makes_a_new_version_and_same_state_appends', validateChangedStateMakesANewVersionAndSameStateAppends)
