import { test, expect } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dispatchRequest } from './playground'
import { initHistory, loadHistory, type RunOutput } from './playgroundHistory'
import type { RunResult } from './client/types'
import { HARD_CODED_QUESTIONS, HARD_CODED_STATE } from './typeSafeQuery'

const PORT = 4318
const ALLOWED_HOST = `127.0.0.1:${PORT}`

async function buildTempHistoryPath() {
    const historyPath = `${mkdtempSync(`${tmpdir()}/playground-test-`)}/results/playground-history.json`
    await initHistory(historyPath)
    return historyPath
}

function failCreatingClient(): never {
    throw new Error('client must not be created')
}

async function validateRunPostUsesTheStubClientAndWritesTheTempFile() {
    Bun.env.TYPESAFE_API_KEY = ''
    const historyPath = await buildTempHistoryPath()
    const headers = { host: ALLOWED_HOST, origin: `http://${ALLOWED_HOST}`, 'content-type': 'application/json' }
    const noKeyRequest = new Request(`http://${ALLOWED_HOST}/run`, { method: 'POST', headers, body: JSON.stringify({ id: 1, calls: 1, state: {}, questions: HARD_CODED_QUESTIONS }) })
    const noKeyResponse = await dispatchRequest(noKeyRequest, PORT, historyPath, failCreatingClient)
    expect(noKeyResponse.status).toBe(400)
    const output = { answers: { requestsAction: { noul: 0.9 } }, usage: { input_tokens: 5, output_tokens: 1 } } as unknown as RunOutput
    function createStubClient() {
        async function stubSystemOne() {
            return output
        }
        return { systemOne: stubSystemOne }
    }
    const keyRequest = new Request(`http://${ALLOWED_HOST}/run`, { method: 'POST', headers, body: JSON.stringify({ id: 1, calls: 2, apiKey: 'typed', state: HARD_CODED_STATE, questions: HARD_CODED_QUESTIONS }) })
    const keyResponse = await dispatchRequest(keyRequest, PORT, historyPath, createStubClient)
    expect(keyResponse.status).toBe(200)
    const result = (await keyResponse.json()) as RunResult
    expect(result.outputs).toEqual([output, output])
    expect(result.version.calls).toBe(2)
    expect((await loadHistory(historyPath))[0].outputs.length).toBe(2)
}

test('test_run_post_uses_the_stub_client_and_writes_the_temp_file', validateRunPostUsesTheStubClientAndWritesTheTempFile)
