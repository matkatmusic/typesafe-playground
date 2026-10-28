import { test, expect, afterEach, mock, spyOn } from 'bun:test'
import * as appendEditedVersionModule from './appendEditedVersion'
import * as fileViewModule from './fileView'
import { createNewDocument, executePicker, executeUnsavedPrompt, openVersionsFile, resetToSavedFile, sendJson, writeVersionsFile } from './versionActions'
import { pageState } from './state'

afterEach(removeStubbedWindow)

function removeStubbedWindow() {
    Reflect.deleteProperty(globalThis, 'window')
}

async function validateSendJsonPostsJsonAndThrowsOnFailure() {
    const realFetch = globalThis.fetch
    let seenInit: RequestInit | undefined
    globalThis.fetch = (async (_path: string, init?: RequestInit) => {
        seenInit = init
        return new Response('nope', { status: 500 })
    }) as unknown as typeof fetch
    try {
        await expect(sendJson('/save', {})).rejects.toThrow('HTTP 500 nope')
        expect(seenInit?.method).toBe('POST')
        expect(seenInit?.body).toBe('{}')
    }
    finally {
        globalThis.fetch = realFetch
    }
}

async function validateCleanDocumentContinuesWithoutAsking() {
    pageState.isDirty = false
    expect(await executeUnsavedPrompt()).toBe(true)
}

async function validateDirtyDocumentAsksThroughTheDialog() {
    pageState.isDirty = true
    await expect(executeUnsavedPrompt()).rejects.toThrow()
    pageState.isDirty = false
}

async function validateResetWithoutAFileHandleThrows() {
    pageState.fileHandle = null
    await expect(resetToSavedFile()).rejects.toThrow('no file is open')
}

function stubWindowPickers(failure: Error) {
    function rejectPicker() {
        return Promise.reject(failure)
    }
    Object.assign(globalThis, { window: { showOpenFilePicker: rejectPicker, showSaveFilePicker: rejectPicker } })
}

async function validateExecutePickerReturnsNullOnAbortAndRethrowsOthers() {
    function abortPicker() {
        return Promise.reject(new DOMException('closed', 'AbortError'))
    }
    function brokenPicker() {
        return Promise.reject(new DOMException('denied', 'SecurityError'))
    }
    expect(await executePicker(abortPicker)).toBeNull()
    await expect(executePicker(brokenPicker)).rejects.toThrow('denied')
}

async function validateCancelledSavePickerLeavesStateUntouched() {
    stubWindowPickers(new DOMException('closed', 'AbortError'))
    pageState.fileHandle = null
    pageState.isDirty = true
    expect(await writeVersionsFile()).toBe(false)
    expect(pageState.fileHandle).toBeNull()
    expect(pageState.isDirty).toBe(true)
    pageState.isDirty = false
}

async function runSaveWithAppendResult(isAppended: boolean) {
    const realFetch = globalThis.fetch
    const seenPaths: string[] = []
    const written: string[] = []
    globalThis.fetch = (async (path: string) => {
        seenPaths.push(path)
        return Response.json({ versions: [{ id: 1 }] })
    }) as unknown as typeof fetch
    spyOn(appendEditedVersionModule, 'appendEditedVersion').mockResolvedValue(isAppended)
    spyOn(fileViewModule, 'refreshFileView').mockImplementation(() => {})
    const writable = { write: async (data: string) => { written.push(data) }, close: async () => {} }
    pageState.fileHandle = { createWritable: async () => writable } as unknown as FileSystemFileHandle
    Object.assign(globalThis, { document: { getElementById: () => ({ textContent: '' }) } })
    try {
        const result = await writeVersionsFile()
        return { result, seenPaths, written }
    }
    finally {
        globalThis.fetch = realFetch
        mock.restore()
        Reflect.deleteProperty(globalThis, 'document')
        pageState.fileHandle = null
        pageState.isDirty = false
    }
}

async function validateSaveWritesTheFileAfterTheEditedVersionIsAppended() {
    const { result, seenPaths, written } = await runSaveWithAppendResult(true)
    expect(result).toBe(true)
    expect(seenPaths).toEqual(['/save'])
    expect(written.length).toBe(1)
}

async function validateSaveWritesNothingWhenTheEditedVersionIsRefused() {
    const { result, seenPaths, written } = await runSaveWithAppendResult(false)
    expect(result).toBe(false)
    expect(seenPaths).toEqual([])
    expect(written).toEqual([])
}

async function validateBrokenSavePickerStillThrows() {
    stubWindowPickers(new DOMException('denied', 'SecurityError'))
    pageState.fileHandle = null
    await expect(writeVersionsFile()).rejects.toThrow('denied')
}

async function validateCancelledOpenPickerLeavesStateUntouched() {
    stubWindowPickers(new DOMException('closed', 'AbortError'))
    pageState.fileHandle = null
    pageState.isDirty = false
    pageState.versions = []
    await openVersionsFile()
    expect(pageState.fileHandle).toBeNull()
    expect(pageState.versions).toEqual([])
}

async function validateBrokenOpenPickerStillThrows() {
    stubWindowPickers(new DOMException('denied', 'SecurityError'))
    pageState.isDirty = false
    await expect(openVersionsFile()).rejects.toThrow('denied')
}

async function validateNewDocumentClearsThePin() {
    const realFetch = globalThis.fetch
    globalThis.fetch = (async () => Response.json({ versions: [{ id: 1 }] })) as unknown as typeof fetch
    pageState.isDirty = false
    pageState.pinnedId = 3
    try {
        await expect(createNewDocument()).rejects.toThrow()
        expect(pageState.pinnedId).toBeNull()
    }
    finally {
        globalThis.fetch = realFetch
        pageState.versions = []
    }
}

test('test_new_document_clears_the_pin', validateNewDocumentClearsThePin)
test('test_execute_picker_returns_null_on_abort_and_rethrows_others', validateExecutePickerReturnsNullOnAbortAndRethrowsOthers)
test('test_cancelled_save_picker_leaves_state_untouched', validateCancelledSavePickerLeavesStateUntouched)
test('test_save_writes_the_file_after_the_edited_version_is_appended', validateSaveWritesTheFileAfterTheEditedVersionIsAppended)
test('test_save_writes_nothing_when_the_edited_version_is_refused', validateSaveWritesNothingWhenTheEditedVersionIsRefused)
test('test_broken_save_picker_still_throws', validateBrokenSavePickerStillThrows)
test('test_cancelled_open_picker_leaves_state_untouched', validateCancelledOpenPickerLeavesStateUntouched)
test('test_broken_open_picker_still_throws', validateBrokenOpenPickerStillThrows)
test('test_send_json_posts_json_and_throws_on_failure', validateSendJsonPostsJsonAndThrowsOnFailure)
test('test_clean_document_continues_without_asking', validateCleanDocumentContinuesWithoutAsking)
test('test_dirty_document_asks_through_the_dialog', validateDirtyDocumentAsksThroughTheDialog)
test('test_reset_without_a_file_handle_throws', validateResetWithoutAFileHandleThrows)
