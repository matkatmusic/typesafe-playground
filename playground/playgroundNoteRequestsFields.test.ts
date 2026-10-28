import { test, expect } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { loadHistory, writeHistory, type RunOutput, type Version } from './playgroundHistory'
import { executeNoteRequest, findInvalidNoteField } from './playgroundNoteRequests'

const OUTPUT = { answers: {}, usage: { input_tokens: 5, output_tokens: 1 } } as unknown as RunOutput

function buildTempHistoryPath() {
  return `${mkdtempSync(`${tmpdir()}/playground-note-fields-test-`)}/results/playground-history.json`
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

async function validateQuestionsNoteIsStoredOnAVersionWithoutRuns() {
  const historyPath = buildTempHistoryPath()
  await writeHistory(historyPath, [buildVersion(1, 0)])
  const response = await executeNoteRequest(buildPostRequest({ id: 1, questionsNote: 'about questions' }), historyPath)
  expect(response.status).toBe(200)
  const history: Version[] = await loadHistory(historyPath)
  expect(history[0].questionsNote).toBe('about questions')
}

async function validateQuestionsNoteRejectsANonString() {
  const historyPath = buildTempHistoryPath()
  await writeHistory(historyPath, [buildVersion(1, 1)])
  const response = await executeNoteRequest(buildPostRequest({ id: 1, questionsNote: ['x'] }), historyPath)
  expect(response.status).toBe(400)
}

async function validateResultNotesMergeKeysOnACompletedRun() {
  const historyPath = buildTempHistoryPath()
  await writeHistory(historyPath, [{ ...buildVersion(1, 1), resultNotes: { first: 'one', second: 'two' } }])
  const response = await executeNoteRequest(buildPostRequest({ id: 1, resultNotes: { second: 'changed', third: 'three' } }), historyPath)
  expect(response.status).toBe(200)
  const history: Version[] = await loadHistory(historyPath)
  expect(history[0].resultNotes).toEqual({ first: 'one', second: 'changed', third: 'three' })
}

async function validateResultNotesRejectBadShapesAndVersionsWithoutRuns() {
  const historyPath = buildTempHistoryPath()
  await writeHistory(historyPath, [buildVersion(1, 1), buildVersion(2, 0)])
  const notAnObject = await executeNoteRequest(buildPostRequest({ id: 1, resultNotes: 'x' }), historyPath)
  expect(notAnObject.status).toBe(400)
  const notAList = await executeNoteRequest(buildPostRequest({ id: 1, resultNotes: ['x'] }), historyPath)
  expect(notAList.status).toBe(400)
  const badValue = await executeNoteRequest(buildPostRequest({ id: 1, resultNotes: { first: 5 } }), historyPath)
  expect(badValue.status).toBe(400)
  const noRun = await executeNoteRequest(buildPostRequest({ id: 2, resultNotes: { first: 'one' } }), historyPath)
  expect(noRun.status).toBe(400)
  const history: Version[] = await loadHistory(historyPath)
  expect(history[0].resultNotes).toBeUndefined()
  expect(history[1].resultNotes).toBeUndefined()
}

function validateFindInvalidNoteFieldNamesTheBadField() {
  expect(findInvalidNoteField({ note: 'a', stateNote: 'b', questionsNote: 'c', resultNotes: { k: 'v' } })).toBeUndefined()
  expect(findInvalidNoteField({ questionsNote: 1 })).toBe('questionsNote must be a string')
  expect(findInvalidNoteField({ resultNotes: null })).toBe('resultNotes must be an object')
}

test('test_questions_note_is_stored_on_a_version_without_runs', validateQuestionsNoteIsStoredOnAVersionWithoutRuns)
test('test_questions_note_rejects_a_non_string', validateQuestionsNoteRejectsANonString)
test('test_result_notes_merge_keys_on_a_completed_run', validateResultNotesMergeKeysOnACompletedRun)
test('test_result_notes_reject_bad_shapes_and_versions_without_runs', validateResultNotesRejectBadShapesAndVersionsWithoutRuns)
test('test_find_invalid_note_field_names_the_bad_field', validateFindInvalidNoteFieldNamesTheBadField)
