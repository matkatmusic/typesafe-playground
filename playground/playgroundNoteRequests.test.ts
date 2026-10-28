import { test, expect } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { loadHistory, writeHistory, type RunOutput, type Version } from './playgroundHistory'
import { executeNoteRequest } from './playgroundNoteRequests'

const OUTPUT = { answers: {}, usage: { input_tokens: 5, output_tokens: 1 } } as unknown as RunOutput

function buildTempHistoryPath() {
  return `${mkdtempSync(`${tmpdir()}/playground-note-test-`)}/results/playground-history.json`
}

function buildPostRequest(body: unknown) {
  return new Request('http://127.0.0.1:4399/note', { method: 'POST', body: JSON.stringify(body) })
}

function buildVersion(id: number, outputCount: number): Version {
  const outputs: RunOutput[] = []
  for (let i = 0; i < outputCount; i++)
    outputs.push(OUTPUT)
  return { id: id, time: 't', state: {}, questions: {}, calls: outputCount, outputs: outputs }
}

async function validateNoteRejectsUnknownId() {
  const historyPath = buildTempHistoryPath()
  await writeHistory(historyPath, [buildVersion(1, 1)])
  const response = await executeNoteRequest(buildPostRequest({ id: 999999, note: 'text' }), historyPath)
  expect(response.status).toBe(400)
}

async function validateNoteRejectsANonStringNote() {
  const historyPath = buildTempHistoryPath()
  await writeHistory(historyPath, [buildVersion(1, 1)])
  const response = await executeNoteRequest(buildPostRequest({ id: 1, note: 5 }), historyPath)
  expect(response.status).toBe(400)
}

async function validateNoteRejectsAVersionWithoutOutputs() {
  const historyPath = buildTempHistoryPath()
  await writeHistory(historyPath, [buildVersion(1, 0)])
  const response = await executeNoteRequest(buildPostRequest({ id: 1, note: 'text' }), historyPath)
  expect(response.status).toBe(400)
  const history: Version[] = await loadHistory(historyPath)
  expect(history[0].note).toBeUndefined()
}

async function validateNoteIsStoredOnTheRightVersion() {
  const historyPath = buildTempHistoryPath()
  await writeHistory(historyPath, [buildVersion(1, 1), buildVersion(2, 1)])
  const response = await executeNoteRequest(buildPostRequest({ id: 2, note: 'good run' }), historyPath)
  expect(response.status).toBe(200)
  const returned = (await response.json()) as Version
  expect(returned.note).toBe('good run')
  const history: Version[] = await loadHistory(historyPath)
  expect(history[1].note).toBe('good run')
  expect(history[0].note).toBeUndefined()
}

async function validateStateNoteIsStoredOnAVersionWithoutRuns() {
  const historyPath = buildTempHistoryPath()
  await writeHistory(historyPath, [buildVersion(1, 0)])
  const response = await executeNoteRequest(buildPostRequest({ id: 1, stateNote: 'about state' }), historyPath)
  expect(response.status).toBe(200)
  const history: Version[] = await loadHistory(historyPath)
  expect(history[0].stateNote).toBe('about state')
  expect(history[0].note).toBeUndefined()
}

async function validateNoteAndStateNoteAreBothStored() {
  const historyPath = buildTempHistoryPath()
  await writeHistory(historyPath, [buildVersion(1, 1)])
  const response = await executeNoteRequest(buildPostRequest({ id: 1, note: 'good run', stateNote: 'about state' }), historyPath)
  expect(response.status).toBe(200)
  const history: Version[] = await loadHistory(historyPath)
  expect(history[0].note).toBe('good run')
  expect(history[0].stateNote).toBe('about state')
}

async function validateStateNoteRejectsANonString() {
  const historyPath = buildTempHistoryPath()
  await writeHistory(historyPath, [buildVersion(1, 1)])
  const response = await executeNoteRequest(buildPostRequest({ id: 1, stateNote: 5 }), historyPath)
  expect(response.status).toBe(400)
  const history: Version[] = await loadHistory(historyPath)
  expect(history[0].stateNote).toBeUndefined()
}

async function validateARequestWithoutAnyNoteIsRejected() {
  const historyPath = buildTempHistoryPath()
  await writeHistory(historyPath, [buildVersion(1, 1)])
  const response = await executeNoteRequest(buildPostRequest({ id: 1 }), historyPath)
  expect(response.status).toBe(400)
}

async function validateAStateNoteDoesNotNeedACompletedRunButANoteStillDoes() {
  const historyPath = buildTempHistoryPath()
  await writeHistory(historyPath, [buildVersion(1, 0)])
  const response = await executeNoteRequest(buildPostRequest({ id: 1, note: 'text', stateNote: 'about state' }), historyPath)
  expect(response.status).toBe(400)
  const history: Version[] = await loadHistory(historyPath)
  expect(history[0].stateNote).toBeUndefined()
}

test('test_state_note_is_stored_on_a_version_without_runs', validateStateNoteIsStoredOnAVersionWithoutRuns)
test('test_note_and_state_note_are_both_stored', validateNoteAndStateNoteAreBothStored)
test('test_state_note_rejects_a_non_string', validateStateNoteRejectsANonString)
test('test_a_request_without_any_note_is_rejected', validateARequestWithoutAnyNoteIsRejected)
test('test_a_note_still_needs_a_completed_run_when_sent_with_a_state_note', validateAStateNoteDoesNotNeedACompletedRunButANoteStillDoes)
test('test_note_rejects_an_id_that_does_not_exist', validateNoteRejectsUnknownId)
test('test_note_rejects_a_note_that_is_not_a_string', validateNoteRejectsANonStringNote)
test('test_note_rejects_a_version_without_outputs', validateNoteRejectsAVersionWithoutOutputs)
test('test_note_is_stored_on_the_right_version', validateNoteIsStoredOnTheRightVersion)
