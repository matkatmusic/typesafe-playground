import { test, expect } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { buildPage, dispatchRequest } from './playground'
import { initHistory } from './playgroundHistory'
import { isPlainObject, isVersionShape } from './playgroundVersionRequests'
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
test('test_open_rejects_bad_versions', validateOpenRejectsBadVersions)
test('test_page_holds_the_unsaved_dialog_and_an_untitled_title', validatePageHoldsTheUnsavedDialogAndAnUntitledTitle)
