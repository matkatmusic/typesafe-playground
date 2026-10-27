import { test, expect } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { buildPage, dispatchRequest } from './playground'
import { initHistory } from './playgroundHistory'
import { executeRunRequest, type CreateRunClient } from './playgroundRequests'
import { executeNewRequest, executeSaveRequest, isPlainObject, isVersionShape } from './playgroundVersionRequests'
import { HARD_CODED_QUESTIONS, HARD_CODED_STATE } from './typeSafeQuery'
import type { Version } from './playgroundHistory'

const PORT = 4318
const ALLOWED_HOST = `127.0.0.1:${PORT}`
const OPENED_VERSION = { id: 7, time: 'now', state: { a: 1 }, questions: {}, calls: 2, outputs: [] }

async function buildTempHistoryPath() {
    const historyPath = `${mkdtempSync(`${tmpdir()}/playground-version-requests-test-`)}/results/playground-history.json`
    await initHistory(historyPath)
    return historyPath
}

function buildPostRequest(path: string, body: unknown) {
    const headers = { host: ALLOWED_HOST, origin: `http://${ALLOWED_HOST}`, 'content-type': 'application/json' }
    return new Request(`http://${ALLOWED_HOST}${path}`, { method: 'POST', headers, body: JSON.stringify(body) })
}

function validateIsPlainObject() {
    expect(isPlainObject({})).toBe(true)
    expect(isPlainObject([])).toBe(false)
    expect(isPlainObject(null)).toBe(false)
    expect(isPlainObject('x')).toBe(false)
}

function validateIsVersionShape() {
    const good = { id: 1, time: 't', state: {}, questions: {}, calls: 0, outputs: [] }
    expect(isVersionShape(good)).toBe(true)
    expect(isVersionShape({ ...good, id: 1.5 })).toBe(false)
    expect(isVersionShape({ ...good, state: [] })).toBe(false)
    expect(isVersionShape({ ...good, questions: null })).toBe(false)
    expect(isVersionShape({ ...good, calls: '0' })).toBe(false)
    expect(isVersionShape({ ...good, outputs: {} })).toBe(false)
    expect(isVersionShape('version')).toBe(false)
}

async function validateOpenThenSaveRoundTripsThroughTheTempFile() {
    const historyPath = await buildTempHistoryPath()
    const openResponse = await dispatchRequest(buildPostRequest('/open', { versions: [OPENED_VERSION] }), PORT, historyPath)
    expect(openResponse.status).toBe(200)
    const saveResponse = await dispatchRequest(buildPostRequest('/save', {}), PORT, historyPath)
    expect(await saveResponse.json()).toEqual({ versions: [OPENED_VERSION] })
}

async function validateNewWritesABlankDocument() {
    const historyPath = await buildTempHistoryPath()
    await dispatchRequest(buildPostRequest('/open', { versions: [OPENED_VERSION] }), PORT, historyPath)
    const newResponse = await dispatchRequest(buildPostRequest('/new', {}), PORT, historyPath)
    const created = (await newResponse.json()) as { versions: Version[] }
    expect(created.versions.length).toBe(1)
    expect(created.versions[0].state).toEqual(HARD_CODED_STATE)
    expect(created.versions[0].questions).toEqual(HARD_CODED_QUESTIONS)
    expect(created.versions[0].calls).toBe(0)
    expect(created.versions[0].outputs).toEqual([])
}

async function validateFirstSubmitAfterNewMakesVersionOneOfOne() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const historyPath = await buildTempHistoryPath()
    await executeNewRequest(historyPath)
    const stubClient = { systemOne: async () => ({ answers: {}, usage: { input_tokens: 5, output_tokens: 1 } }) }
    const createClient = (() => stubClient) as unknown as CreateRunClient
    const body = JSON.stringify({ id: 1, calls: 1, state: { typed: 'changed' }, questions: HARD_CODED_QUESTIONS })
    const response = await executeRunRequest(new Request(`http://${ALLOWED_HOST}/run`, { method: 'POST', body }), createClient, historyPath)
    const result = (await response.json()) as { version: Version }
    expect(result.version.id).toBe(1)
    const saved = (await (await executeSaveRequest(historyPath)).json()) as { versions: Version[] }
    expect(saved.versions.length).toBe(1)
    expect(saved.versions[0].state).toEqual({ typed: 'changed' })
    expect(saved.versions[0].outputs.length).toBe(1)
}

async function validateResetRunsClearsOutputsAndCallsOfOneVersionAndKeepsTheRest() {
    const historyPath = await buildTempHistoryPath()
    const ranVersion = (id: number) => ({ id, time: 't', state: { a: id }, questions: { q: id }, calls: 2, outputs: [{}, {}], note: 'kept' })
    await dispatchRequest(buildPostRequest('/open', { versions: [ranVersion(1), ranVersion(2)] }), PORT, historyPath)
    const response = await dispatchRequest(buildPostRequest('/reset-runs', { id: 2 }), PORT, historyPath)
    expect(response.status).toBe(200)
    const cleared = (await response.json()) as Version
    expect(cleared).toEqual({ id: 2, time: 't', state: { a: 2 }, questions: { q: 2 }, calls: 0, outputs: [], note: 'kept' })
    const saved = (await (await executeSaveRequest(historyPath)).json()) as { versions: Version[] }
    expect(saved.versions[1]).toEqual(cleared)
    expect(saved.versions[0]).toEqual(ranVersion(1) as unknown as Version)
}

async function validateResetRunsRejectsAnUnknownId() {
    const historyPath = await buildTempHistoryPath()
    const response = await dispatchRequest(buildPostRequest('/reset-runs', { id: 999999 }), PORT, historyPath)
    expect(response.status).toBe(400)
}

async function validateSubmitAfterResettingTheOnlyVersionFillsItInPlace() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const historyPath = await buildTempHistoryPath()
    const oldRun = { answers: {}, usage: { input_tokens: 1, output_tokens: 1 } }
    const ranVersion = { id: 1, time: 't', state: { a: 1 }, questions: {}, calls: 1, outputs: [oldRun], note: 'old note' }
    await dispatchRequest(buildPostRequest('/open', { versions: [ranVersion] }), PORT, historyPath)
    await dispatchRequest(buildPostRequest('/reset-runs', { id: 1 }), PORT, historyPath)
    const stubClient = { systemOne: async () => ({ answers: {}, usage: { input_tokens: 5, output_tokens: 1 } }) }
    const createClient = (() => stubClient) as unknown as CreateRunClient
    const body = JSON.stringify({ id: 1, calls: 1, state: { typed: 'new' }, questions: {} })
    await executeRunRequest(new Request(`http://${ALLOWED_HOST}/run`, { method: 'POST', body }), createClient, historyPath)
    const saved = (await (await executeSaveRequest(historyPath)).json()) as { versions: Version[] }
    expect(saved.versions.length).toBe(1)
    expect(saved.versions[0].calls).toBe(1)
    expect(saved.versions[0].outputs.length).toBe(1)
    expect(saved.versions[0].state).toEqual({ typed: 'new' })
}

async function validateOpenRejectsBadVersions() {
    const historyPath = await buildTempHistoryPath()
    const emptyResponse = await dispatchRequest(buildPostRequest('/open', { versions: [] }), PORT, historyPath)
    expect(emptyResponse.status).toBe(400)
    const badResponse = await dispatchRequest(buildPostRequest('/open', { versions: [{ id: 'x' }] }), PORT, historyPath)
    expect(badResponse.status).toBe(400)
}

async function validatePageHoldsTheUnsavedDialogAndAnUntitledTitle() {
    const page = await buildPage(await buildTempHistoryPath())
    expect(page.includes('id="unsavedDialog"')).toBe(true)
    expect(page.includes('<title>Playground - Untitled</title>')).toBe(true)
}

test('test_is_plain_object_rejects_arrays_and_null', validateIsPlainObject)
test('test_is_version_shape_checks_every_field', validateIsVersionShape)
test('test_open_then_save_round_trips_through_the_temp_file', validateOpenThenSaveRoundTripsThroughTheTempFile)
test('test_new_writes_a_blank_document', validateNewWritesABlankDocument)
test('test_first_submit_after_new_makes_version_one_of_one', validateFirstSubmitAfterNewMakesVersionOneOfOne)
test('test_reset_runs_clears_outputs_and_calls_of_one_version_and_keeps_the_rest', validateResetRunsClearsOutputsAndCallsOfOneVersionAndKeepsTheRest)
test('test_reset_runs_rejects_an_unknown_id', validateResetRunsRejectsAnUnknownId)
test('test_submit_after_resetting_the_only_version_fills_it_in_place', validateSubmitAfterResettingTheOnlyVersionFillsItInPlace)
test('test_open_rejects_bad_versions', validateOpenRejectsBadVersions)
test('test_page_holds_the_unsaved_dialog_and_an_untitled_title', validatePageHoldsTheUnsavedDialogAndAnUntitledTitle)
