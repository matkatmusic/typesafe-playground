import { test, expect, mock, spyOn } from 'bun:test'
import * as appendEditedVersionModule from './appendEditedVersion'
import * as fileViewModule from './fileView'
import { pageState } from './state'
import { writeVersionsFile } from './versionActions'

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

test('test_save_writes_the_file_after_the_edited_version_is_appended', validateSaveWritesTheFileAfterTheEditedVersionIsAppended)
test('test_save_writes_nothing_when_the_edited_version_is_refused', validateSaveWritesNothingWhenTheEditedVersionIsRefused)
