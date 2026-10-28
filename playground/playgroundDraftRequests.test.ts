import { test, expect } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dispatchRequest } from './playground'
import { initHistory } from './playgroundHistory'
import { computeDraftPath, readDraft } from './playgroundDraftRequests'

const PORT = 4321
const ALLOWED_HOST = `127.0.0.1:${PORT}`
const SESSION_ID = '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d'

async function buildTempHistoryPath() {
  const historyPath = `${mkdtempSync(`${tmpdir()}/playground-draft-test-`)}/results/playground-history.json`
  await initHistory(historyPath)
  return historyPath
}

function buildDraftRequest(body: unknown) {
  const headers = { host: ALLOWED_HOST, origin: `http://${ALLOWED_HOST}`, 'content-type': 'application/json' }
  return new Request(`http://${ALLOWED_HOST}/draft`, { method: 'POST', headers: headers, body: JSON.stringify(body) })
}

function buildDraftGetRequest(id: string) {
  return new Request(`http://${ALLOWED_HOST}/draft?id=${id}`, { headers: { host: ALLOWED_HOST } })
}

async function validateDraftPostWritesTheRawTextInASessionFileBesideTheHistoryFile() {
  const historyPath = await buildTempHistoryPath()
  const body = { state: '{"a": ', questions: '[1,' }
  const response = await dispatchRequest(buildDraftRequest({ id: SESSION_ID, ...body }), PORT, historyPath)
  expect(response.status).toBe(200)
  expect(computeDraftPath(historyPath, SESSION_ID)).toBe(historyPath.replace('playground-history.json', `.currentSession-${SESSION_ID}.json`))
  expect(await readDraft(historyPath, SESSION_ID)).toEqual(body)
}

async function validateDraftPostRejectsNonStringFields() {
  const historyPath = await buildTempHistoryPath()
  const badState = await dispatchRequest(buildDraftRequest({ id: SESSION_ID, state: {}, questions: '' }), PORT, historyPath)
  expect(badState.status).toBe(400)
  const badQuestions = await dispatchRequest(buildDraftRequest({ id: SESSION_ID, state: '', questions: 3 }), PORT, historyPath)
  expect(badQuestions.status).toBe(400)
  expect(await readDraft(historyPath, SESSION_ID)).toBeNull()
}

async function validateDraftRoutesRejectAnIdThatIsNotALowercaseUuid() {
  const historyPath = await buildTempHistoryPath()
  const badIds = ['../escape', '', 'ABCDEF01-4e5f-4a6b-8c7d-9e0f1a2b3c4d', `${SESSION_ID}x`]
  for (const badId of badIds) {
    const postResponse = await dispatchRequest(buildDraftRequest({ id: badId, state: '', questions: '' }), PORT, historyPath)
    expect(postResponse.status).toBe(400)
    const getResponse = await dispatchRequest(buildDraftGetRequest(encodeURIComponent(badId)), PORT, historyPath)
    expect(getResponse.status).toBe(400)
  }
  const missingIdPost = await dispatchRequest(buildDraftRequest({ state: '', questions: '' }), PORT, historyPath)
  expect(missingIdPost.status).toBe(400)
  const missingIdGet = await dispatchRequest(new Request(`http://${ALLOWED_HOST}/draft`, { headers: { host: ALLOWED_HOST } }), PORT, historyPath)
  expect(missingIdGet.status).toBe(400)
}

async function validateDraftGetReturnsNullForAMissingFileAndTheFileJsonOtherwise() {
  const historyPath = await buildTempHistoryPath()
  const missing = await dispatchRequest(buildDraftGetRequest(SESSION_ID), PORT, historyPath)
  expect(missing.status).toBe(200)
  expect(await missing.json()).toBeNull()
  await dispatchRequest(buildDraftRequest({ id: SESSION_ID, state: 's', questions: 'q' }), PORT, historyPath)
  const found = await dispatchRequest(buildDraftGetRequest(SESSION_ID), PORT, historyPath)
  expect(await found.json()).toEqual({ state: 's', questions: 'q' })
}

// async function validatePageDataHoldsTheDraftOnlyWhenOneWasWritten() {
//   const historyPath = await buildTempHistoryPath()
//   expect((await buildPage(historyPath)).includes('"draft":null')).toBe(true)
//   await dispatchRequest(buildDraftRequest({ state: 's', questions: 'q' }), PORT, historyPath)
//   expect((await buildPage(historyPath)).includes('"draft":{"state":"s","questions":"q"}')).toBe(true)
// }

test('test_draft_post_writes_the_raw_text_in_a_session_file_beside_the_history_file', validateDraftPostWritesTheRawTextInASessionFileBesideTheHistoryFile)
test('test_draft_post_rejects_non_string_fields', validateDraftPostRejectsNonStringFields)
test('test_draft_routes_reject_an_id_that_is_not_a_lowercase_uuid', validateDraftRoutesRejectAnIdThatIsNotALowercaseUuid)
test('test_draft_get_returns_null_for_a_missing_file_and_the_file_json_otherwise', validateDraftGetReturnsNullForAMissingFileAndTheFileJsonOtherwise)
// test('test_page_data_holds_the_draft_only_when_one_was_written', validatePageDataHoldsTheDraftOnlyWhenOneWasWritten)
