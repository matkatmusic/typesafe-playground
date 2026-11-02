import { test, expect, afterEach, mock, spyOn } from 'bun:test'
import type { Version } from '../playgroundHistory'
import { deleteShownVersion, DELETE_CONFIRM_TEXT } from './deleteVersion'
import * as pinInfo from './pinInfo'
import { pageState } from './state'
import * as versionBox from './versionBox'

const realFetch = globalThis.fetch

afterEach(removeFakeState)

function removeFakeState() {
  mock.restore()
  Reflect.deleteProperty(globalThis, 'document')
  Reflect.deleteProperty(globalThis, 'confirm')
  globalThis.fetch = realFetch
  pageState.isDirty = false
  pageState.pinnedIndex = null
  pageState.versions = []
  pageState.index = 0
  pageState.editedDraft = null
  pageState.pendingNotes = { state: null, questions: null }
}

function buildVersions(): Version[] {
  return [
    { time: 'a', state: { n: 1 }, questions: {}, calls: 0, outputs: [], note: 'first' },
    { time: 'b', state: { n: 2 }, questions: {}, calls: 0, outputs: [], note: 'second' },
    { time: 'c', state: { n: 3 }, questions: {}, calls: 0, outputs: [], note: 'third' },
  ]
}

function installDeleteScene(answer: boolean) {
  const elements = { lastEditedLabel: { textContent: '' } }
  Object.assign(globalThis, { document: { getElementById: (id: keyof typeof elements) => elements[id] }, confirm: () => answer })
  const seen: { path: string; body: { versions: Version[] } }[] = []
  async function stubFetch(path: string | URL | Request, init?: RequestInit) {
    const body = JSON.parse(String(init?.body))
    seen.push({ path: String(path), body: body })
    return Response.json({ versions: body.versions })
  }
  globalThis.fetch = stubFetch as typeof fetch
  const renderSpy = spyOn(versionBox, 'renderShownVersion').mockImplementation(() => {})
  const pinInfoSpy = spyOn(pinInfo, 'applyPinInfo').mockImplementation(() => {})
  pageState.versions = buildVersions()
  return { elements, seen, renderSpy, pinInfoSpy }
}

function validateTheConfirmTextIsExact() {
  expect(DELETE_CONFIRM_TEXT).toBe('Are you sure you want to delete this version (state, questions, results, notes, comments) from this session?')
}

async function validateDeclinedConfirmChangesNothing() {
  const { seen, renderSpy } = installDeleteScene(false)
  pageState.index = 1
  await deleteShownVersion()
  expect(seen).toEqual([])
  expect(pageState.versions.length).toBe(3)
  expect(pageState.isDirty).toBe(false)
  expect(renderSpy).not.toHaveBeenCalled()
}

async function validateConfirmedDeleteSendsTheRemainingVersionsThroughOpen() {
  const { seen } = installDeleteScene(true)
  pageState.index = 1
  await deleteShownVersion()
  expect(seen.length).toBe(1)
  expect(seen[0].path).toBe('/open')
  expect(seen[0].body.versions.map((version) => version.note)).toEqual(['first', 'third'])
  expect(pageState.versions.map((version) => version.note)).toEqual(['first', 'third'])
}

async function validateDeleteShowsTheVersionThatTookItsPlace() {
  const { renderSpy } = installDeleteScene(true)
  pageState.index = 1
  await deleteShownVersion()
  expect(pageState.index).toBe(1)
  expect(pageState.versions[pageState.index].note).toBe('third')
  expect(renderSpy).toHaveBeenCalledTimes(1)
}

async function validateDeletingTheLastVersionShowsTheNewLastVersion() {
  installDeleteScene(true)
  pageState.index = 2
  await deleteShownVersion()
  expect(pageState.index).toBe(1)
  expect(pageState.versions[pageState.index].note).toBe('second')
}

async function validateDeleteMarksThePageChanged() {
  const { elements } = installDeleteScene(true)
  await deleteShownVersion()
  expect(pageState.isDirty).toBe(true)
  expect(elements.lastEditedLabel.textContent).toContain('last edited: ')
}

async function validateDeleteDiscardsTheEditedDraftAndPendingNotes() {
  installDeleteScene(true)
  pageState.editedDraft = { state: 'x', questions: 'y', baseIndex: 0 }
  pageState.pendingNotes = { state: 'pending', questions: null }
  await deleteShownVersion()
  expect(pageState.editedDraft).toBeNull()
  expect(pageState.pendingNotes).toEqual({ state: null, questions: null })
}

async function validatePinAfterTheDeletedVersionMovesDownByOne() {
  const { pinInfoSpy } = installDeleteScene(true)
  pageState.index = 0
  pageState.pinnedIndex = 2
  await deleteShownVersion()
  expect(pageState.pinnedIndex).toBe(1)
  expect(pinInfoSpy).toHaveBeenCalledWith(1)
}

async function validatePinBeforeTheDeletedVersionStays() {
  installDeleteScene(true)
  pageState.index = 2
  pageState.pinnedIndex = 0
  await deleteShownVersion()
  expect(pageState.pinnedIndex).toBe(0)
}

async function validateDeletingThePinnedVersionClearsThePin() {
  installDeleteScene(true)
  pageState.index = 1
  pageState.pinnedIndex = 1
  await deleteShownVersion()
  expect(pageState.pinnedIndex).toBeNull()
}

test('test_the_confirm_text_is_exact', validateTheConfirmTextIsExact)
test('test_declined_confirm_changes_nothing', validateDeclinedConfirmChangesNothing)
test('test_confirmed_delete_sends_the_remaining_versions_through_open', validateConfirmedDeleteSendsTheRemainingVersionsThroughOpen)
test('test_delete_shows_the_version_that_took_its_place', validateDeleteShowsTheVersionThatTookItsPlace)
test('test_deleting_the_last_version_shows_the_new_last_version', validateDeletingTheLastVersionShowsTheNewLastVersion)
test('test_delete_marks_the_page_changed', validateDeleteMarksThePageChanged)
test('test_delete_discards_the_edited_draft_and_pending_notes', validateDeleteDiscardsTheEditedDraftAndPendingNotes)
test('test_pin_after_the_deleted_version_moves_down_by_one', validatePinAfterTheDeletedVersionMovesDownByOne)
test('test_pin_before_the_deleted_version_stays', validatePinBeforeTheDeletedVersionStays)
test('test_deleting_the_pinned_version_clears_the_pin', validateDeletingThePinnedVersionClearsThePin)
