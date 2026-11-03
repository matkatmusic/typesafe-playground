import { test, expect } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { buildPage, dispatchRequest } from './playground'
import { initHistory, loadHistory } from './playgroundHistory'
import { executeRunRequest, type CreateRunClient } from './playgroundRequests'
import { executeNewRequest, executeSaveRequest, isPlainObject, isVersionShape } from './playgroundVersionRequests'
import { HARD_CODED_QUESTIONS, HARD_CODED_STATE } from './typeSafeQuery'
import type { Version } from './playgroundHistory'

const PORT = 4318
const ALLOWED_HOST = `127.0.0.1:${PORT}`
const OPENED_VERSION = { time: 'now', state: { a: 1 }, questions: {}, calls: 2, outputs: [] }

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
    const good = { time: 't', state: {}, questions: {}, calls: 0, outputs: [] }
    expect(isVersionShape(good)).toBe(true)
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

async function validateNewWritesAHistoryFileWithoutIdKeys() {
    const historyPath = await buildTempHistoryPath()
    await dispatchRequest(buildPostRequest('/new', {}), PORT, historyPath)
    const written = (await Bun.file(historyPath).json()) as object[]
    expect(written.length).toBe(1)
    expect('id' in written[0]).toBe(false)
}

async function validateOpenReturnsVersionsWithoutIdKeys() {
    const historyPath = await buildTempHistoryPath()
    const response = await dispatchRequest(buildPostRequest('/open', { versions: [{ ...OPENED_VERSION, id: 7 }] }), PORT, historyPath)
    expect(response.status).toBe(200)
    const opened = (await response.json()) as { versions: object[] }
    expect(opened.versions.length).toBe(1)
    expect('id' in opened.versions[0]).toBe(false)
}

async function validateLoadHistoryStripsOldIdKeys() {
    const historyPath = await buildTempHistoryPath()
    await Bun.write(historyPath, JSON.stringify([{ ...OPENED_VERSION, id: 3 }, { ...OPENED_VERSION, id: 4 }]))
    const history = await loadHistory(historyPath)
    expect(history.length).toBe(2)
    expect('id' in history[0]).toBe(false)
    expect('id' in history[1]).toBe(false)
}

function validateVersionWithoutIdPassesIsVersionShape() {
    expect('id' in OPENED_VERSION).toBe(false)
    expect(isVersionShape(OPENED_VERSION)).toBe(true)
}

async function validateFirstSubmitAfterNewMakesVersionOneOfOne() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const historyPath = await buildTempHistoryPath()
    await executeNewRequest(historyPath)
    const stubClient = { systemOne: async () => ({ answers: {}, usage: { input_tokens: 5, output_tokens: 1 } }) }
    const createClient = (() => stubClient) as unknown as CreateRunClient
    const body = JSON.stringify({ index: 0, calls: 1, state: { typed: 'changed' }, questions: HARD_CODED_QUESTIONS })
    const response = await executeRunRequest(new Request(`http://${ALLOWED_HOST}/run`, { method: 'POST', body }), createClient, historyPath)
    const result = (await response.json()) as { version: Version; index: number }
    expect(result.index).toBe(0)
    const saved = (await (await executeSaveRequest(historyPath)).json()) as { versions: Version[] }
    expect(saved.versions.length).toBe(1)
    expect(saved.versions[0].state).toEqual({ typed: 'changed' })
    expect(saved.versions[0].outputs.length).toBe(1)
}

async function validateResetRunsClearsOutputsAndCallsOfOneVersionAndKeepsTheRest() {
    const historyPath = await buildTempHistoryPath()
    const ranVersion = (id: number) => ({ time: 't', state: { a: id }, questions: { q: id }, calls: 2, outputs: [{}, {}], note: 'kept' })
    await dispatchRequest(buildPostRequest('/open', { versions: [ranVersion(1), ranVersion(2)] }), PORT, historyPath)
    const response = await dispatchRequest(buildPostRequest('/reset-runs', { index: 1 }), PORT, historyPath)
    expect(response.status).toBe(200)
    const cleared = (await response.json()) as Version
    // expect(cleared).toEqual({ time: 't', state: { a: 2 }, questions: { q: 2 }, calls: 0, outputs: [], note: 'kept' })
    expect(cleared).toEqual({ time: 't', state: { a: 2 }, questions: { q: 2 }, calls: 0, outputs: [], note: 'kept' } as unknown as Version)
    const saved = (await (await executeSaveRequest(historyPath)).json()) as { versions: Version[] }
    expect(saved.versions[1]).toEqual(cleared)
    expect(saved.versions[0]).toEqual(ranVersion(1) as unknown as Version)
}

async function validateResetRunsRejectsAnUnknownIndex() {
    const historyPath = await buildTempHistoryPath()
    const response = await dispatchRequest(buildPostRequest('/reset-runs', { index: 999999 }), PORT, historyPath)
    expect(response.status).toBe(400)
    expect(await response.text()).toBe('index must be the integer index of an existing version')
}

async function validateSubmitAfterResettingTheOnlyVersionFillsItInPlace() {
    Bun.env.TYPESAFE_API_KEY = 'env-key'
    const historyPath = await buildTempHistoryPath()
    const oldRun = { answers: {}, usage: { input_tokens: 1, output_tokens: 1 } }
    const ranVersion = { time: 't', state: { a: 1 }, questions: HARD_CODED_QUESTIONS, calls: 1, outputs: [oldRun], note: 'old note' }
    await dispatchRequest(buildPostRequest('/open', { versions: [ranVersion] }), PORT, historyPath)
    await dispatchRequest(buildPostRequest('/reset-runs', { index: 0 }), PORT, historyPath)
    const stubClient = { systemOne: async () => ({ answers: {}, usage: { input_tokens: 5, output_tokens: 1 } }) }
    const createClient = (() => stubClient) as unknown as CreateRunClient
    const body = JSON.stringify({ index: 0, calls: 1, state: { typed: 'new' }, questions: {} })
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
test('test_reset_runs_rejects_an_unknown_index', validateResetRunsRejectsAnUnknownIndex)
test('test_new_writes_a_history_file_without_id_keys', validateNewWritesAHistoryFileWithoutIdKeys)
test('test_open_returns_versions_without_id_keys', validateOpenReturnsVersionsWithoutIdKeys)
test('test_load_history_strips_old_id_keys', validateLoadHistoryStripsOldIdKeys)
test('test_a_version_without_id_passes_is_version_shape', validateVersionWithoutIdPassesIsVersionShape)
test('test_submit_after_resetting_the_only_version_fills_it_in_place', validateSubmitAfterResettingTheOnlyVersionFillsItInPlace)
test('test_open_rejects_bad_versions', validateOpenRejectsBadVersions)
test('test_page_holds_the_unsaved_dialog_and_an_untitled_title', validatePageHoldsTheUnsavedDialogAndAnUntitledTitle)
