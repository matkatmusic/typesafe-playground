import { test, expect } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { buildPage, dispatchRequest } from './playground'
import { initHistory } from './playgroundHistory'
import { computeDraftPath, readDraft } from './playgroundDraftRequests'

const PORT = 4321
const ALLOWED_HOST = `127.0.0.1:${PORT}`

async function buildTempHistoryPath() {
  const historyPath = `${mkdtempSync(`${tmpdir()}/playground-draft-test-`)}/results/playground-history.json`
  await initHistory(historyPath)
  return historyPath
}

function buildDraftRequest(body: unknown) {
  const headers = { host: ALLOWED_HOST, origin: `http://${ALLOWED_HOST}`, 'content-type': 'application/json' }
  return new Request(`http://${ALLOWED_HOST}/draft`, { method: 'POST', headers: headers, body: JSON.stringify(body) })
}

async function validateDraftPostWritesTheRawTextBesideTheHistoryFile() {
  const historyPath = await buildTempHistoryPath()
  const body = { state: '{"a": ', questions: '[1,' }
  const response = await dispatchRequest(buildDraftRequest(body), PORT, historyPath)
  expect(response.status).toBe(200)
  expect(computeDraftPath(historyPath)).toBe(historyPath.replace('playground-history.json', 'playground-draft.json'))
  expect(await readDraft(historyPath)).toEqual(body)
}

async function validateDraftPostRejectsNonStringFields() {
  const historyPath = await buildTempHistoryPath()
  const badState = await dispatchRequest(buildDraftRequest({ state: {}, questions: '' }), PORT, historyPath)
  expect(badState.status).toBe(400)
  const badQuestions = await dispatchRequest(buildDraftRequest({ state: '', questions: 3 }), PORT, historyPath)
  expect(badQuestions.status).toBe(400)
  expect(await readDraft(historyPath)).toBeNull()
}

async function validatePageDataHoldsTheDraftOnlyWhenOneWasWritten() {
  const historyPath = await buildTempHistoryPath()
  expect((await buildPage(historyPath)).includes('"draft":null')).toBe(true)
  await dispatchRequest(buildDraftRequest({ state: 's', questions: 'q' }), PORT, historyPath)
  expect((await buildPage(historyPath)).includes('"draft":{"state":"s","questions":"q"}')).toBe(true)
}

test('test_draft_post_writes_the_raw_text_beside_the_history_file', validateDraftPostWritesTheRawTextBesideTheHistoryFile)
test('test_draft_post_rejects_non_string_fields', validateDraftPostRejectsNonStringFields)
test('test_page_data_holds_the_draft_only_when_one_was_written', validatePageDataHoldsTheDraftOnlyWhenOneWasWritten)
