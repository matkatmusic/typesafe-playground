import { test, expect, afterEach, mock, spyOn } from 'bun:test'
import type { EditorView } from '@codemirror/view'
import { appendEditedVersion } from './appendEditedVersion'
import * as costTokens from './costTokens'
import * as editors from './editors'
import * as graphs from './graphs'
import * as noteBox from './noteBox'
import * as pinButtons from './pinButtons'
import { pageState } from './state'
import * as versionArrows from './versionArrows'
import * as versionBox from './versionBox'
import * as winnersDom from './winnersDom'

const realFetch = globalThis.fetch

afterEach(() => {
  mock.restore()
  Reflect.deleteProperty(globalThis, 'document')
  globalThis.fetch = realFetch
  pageState.versions = []
  pageState.index = 0
})

function buildVersion(id: number) {
  return { id: id, time: 't', state: { a: 1 }, questions: { q: 1 }, calls: 2, outputs: [], note: 'old note' }
}

function installPage(stateText: string, questionsText: string) {
  pageState.versions = [buildVersion(1)]
  pageState.index = 0
  function buildStub(text: string) {
    return { state: { doc: { toString: () => text } } } as unknown as EditorView
  }
  spyOn(editors, 'getStateEditor').mockReturnValue(buildStub(stateText))
  spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildStub(questionsText))
  const errorLine = { textContent: '' }
  Object.assign(globalThis, { document: { getElementById: () => errorLine } })
  const refreshSpy = spyOn(versionBox, 'refreshVersionBox').mockImplementation(() => {})
  const arrowsSpy = spyOn(versionArrows, 'updateVersionArrows').mockImplementation(() => {})
  const pinSpy = spyOn(pinButtons, 'applyPinButtons').mockImplementation(() => {})
  const renderSpies = {
    note: spyOn(noteBox, 'applyNoteBox').mockImplementation(() => {}),
    cost: spyOn(costTokens, 'renderCostAndTokens').mockImplementation(() => {}),
    result: spyOn(editors, 'renderResultJson').mockImplementation(() => {}),
    graphs: spyOn(graphs, 'renderGraphs').mockImplementation(() => {}),
    winners: spyOn(winnersDom, 'renderWinners').mockImplementation(() => {}),
    stateFill: spyOn(editors, 'renderStateJson').mockImplementation(() => {}),
    questionsFill: spyOn(editors, 'renderQuestionsJson').mockImplementation(() => {}),
  }
  return { errorLine, refreshSpy, arrowsSpy, pinSpy, renderSpies }
}

function installOpenFetch() {
  const seen: { path: string; body: { versions: unknown[] } }[] = []
  async function stubFetch(path: string | URL | Request, init?: RequestInit) {
    const body = JSON.parse(String(init?.body))
    seen.push({ path: String(path), body: body })
    return Response.json({ versions: body.versions })
  }
  globalThis.fetch = stubFetch as typeof fetch
  return seen
}

async function validateEditedTextAppendsOneUnrunVersionWithTheParsedText() {
  const { refreshSpy, arrowsSpy, pinSpy, renderSpies } = installPage('{"a": 2}', '{"q": 1}')
  const seen = installOpenFetch()
  pageState.pinnedId = 1
  expect(await appendEditedVersion()).toBe(true)
  expect(seen.length).toBe(1)
  expect(seen[0].path).toBe('/open')
  expect(seen[0].body.versions).toEqual([
    buildVersion(1),
    { id: 2, time: 'not run yet', state: { a: 2 }, questions: { q: 1 }, calls: 0, outputs: [] },
  ])
  expect(pageState.versions.length).toBe(2)
  expect(pageState.index).toBe(1)
  expect(pageState.pinnedId).toBe(1)
  expect(refreshSpy).toHaveBeenCalledTimes(1)
  expect(arrowsSpy).toHaveBeenCalledTimes(1)
  expect(pinSpy).toHaveBeenCalledTimes(1)
  const appendedVersion = pageState.versions[1]
  expect(renderSpies.note).toHaveBeenCalledWith(appendedVersion)
  expect(renderSpies.cost).toHaveBeenCalledWith(appendedVersion)
  expect(renderSpies.result).toHaveBeenCalledWith([])
  expect(renderSpies.graphs.mock.calls[0][0]).toBe(appendedVersion)
  expect(renderSpies.winners.mock.calls[0][0]).toBe(appendedVersion)
  expect(renderSpies.stateFill).not.toHaveBeenCalled()
  expect(renderSpies.questionsFill).not.toHaveBeenCalled()
  pageState.pinnedId = null
}

async function validateInvalidJsonSendsNothingAndShowsTheError() {
  const { errorLine, refreshSpy } = installPage('{"a": 1}', '{"q": ')
  const seen = installOpenFetch()
  expect(await appendEditedVersion()).toBe(false)
  expect(seen).toEqual([])
  expect(errorLine.textContent).toContain('questions is not valid JSON')
  expect(pageState.versions.length).toBe(1)
  expect(refreshSpy).not.toHaveBeenCalled()
}

async function validateUneditedTextSendsNothing() {
  installPage('{"a": 1}', '{ "q": 1 }')
  const seen = installOpenFetch()
  expect(await appendEditedVersion()).toBe(true)
  expect(seen).toEqual([])
  expect(pageState.versions.length).toBe(1)
}

test('test_edited_text_appends_one_unrun_version_with_the_parsed_text', validateEditedTextAppendsOneUnrunVersionWithTheParsedText)
test('test_invalid_json_sends_nothing_and_shows_the_error', validateInvalidJsonSendsNothingAndShowsTheError)
test('test_unedited_text_sends_nothing', validateUneditedTextSendsNothing)
