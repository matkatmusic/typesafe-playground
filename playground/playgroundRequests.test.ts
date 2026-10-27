import { test, expect } from 'bun:test'
import { executeRunRequest, MISSING_KEY_MESSAGE, selectApiKey, type CreateRunClient } from './playgroundRequests'
import { hideKeysInMessage } from './serverErrors'
import { HARD_CODED_QUESTIONS, HARD_CODED_STATE } from './typeSafeQuery'

type Call = { apiKey: string; request: unknown }

function makeStubFactory(calls: Call[], output: unknown): CreateRunClient {
    function createStubClient(apiKey: string) {
        async function stubSystemOne(request: unknown) {
            calls.push({ apiKey, request })
            return output
        }
        return { systemOne: stubSystemOne }
    }
    return createStubClient
}

function makeRunRequest(body: unknown): Request {
    return new Request('http://127.0.0.1:4399/run', { method: 'POST', body: JSON.stringify(body) })
}

function validateTypedKeyBeatsEnvKey() {
    expect(selectApiKey('typed', 'env')).toBe('typed')
    expect(selectApiKey('', 'env')).toBe('env')
    expect(selectApiKey('', '')).toBe('')
}

async function validateTypedKeyIsUsedOverEnvKey() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const calls: Call[] = []
    const response = await executeRunRequest(makeRunRequest({ apiKey: '  typed-key ' }), makeStubFactory(calls, { answers: {} }))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ answers: {} })
    expect(calls.length).toBe(1)
    expect(calls[0].apiKey).toBe('typed-key')
}

async function validateEnvKeyIsUsedWhenNothingIsTyped() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const calls: Call[] = []
    await executeRunRequest(makeRunRequest({ apiKey: '' }), makeStubFactory(calls, {}))
    expect(calls[0].apiKey).toBe('env-key')
    await executeRunRequest(makeRunRequest({}), makeStubFactory(calls, {}))
    expect(calls[1].apiKey).toBe('env-key')
}

async function validateNoKeyReturns400WithoutCallingTheClient() {
    Bun.env.TYPESAFE_API_KEY = ''
    const calls: Call[] = []
    const response = await executeRunRequest(makeRunRequest({ apiKey: '   ' }), makeStubFactory(calls, {}))
    expect(response.status).toBe(400)
    expect(await response.text()).toBe(MISSING_KEY_MESSAGE)
    expect(MISSING_KEY_MESSAGE).toBe('Add a TypeSafe API key')
    expect(calls.length).toBe(0)
}

async function validateClientReceivesTheHardCodedQuery() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const calls: Call[] = []
    await executeRunRequest(makeRunRequest({}), makeStubFactory(calls, {}))
    expect(calls[0].request).toEqual({ state: HARD_CODED_STATE, questions: HARD_CODED_QUESTIONS })
}

async function validateTypedKeyIsHiddenInLaterErrorMessages() {
    Bun.env.TYPESAFE_API_KEY = ''
    await executeRunRequest(makeRunRequest({ apiKey: 'typed-secret-789' }), makeStubFactory([], {}))
    expect(hideKeysInMessage('failed with typed-secret-789')).toBe('failed with [key hidden]')
}

test('test_typed_key_beats_env_key', validateTypedKeyBeatsEnvKey)
test('test_run_uses_typed_key_over_env_key', validateTypedKeyIsUsedOverEnvKey)
test('test_run_uses_env_key_when_nothing_is_typed', validateEnvKeyIsUsedWhenNothingIsTyped)
test('test_run_with_no_key_returns_400_and_makes_no_call', validateNoKeyReturns400WithoutCallingTheClient)
test('test_run_sends_the_hard_coded_query', validateClientReceivesTheHardCodedQuery)
test('test_run_remembers_typed_key_for_error_scrubbing', validateTypedKeyIsHiddenInLaterErrorMessages)
