import { test, expect } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { buildBlankVersion, initHistory, loadHistory, writeHistory } from './playgroundHistory'
import { NOT_RUN_TIME } from './notRunTime'
import { HARD_CODED_QUESTIONS, HARD_CODED_STATE } from './typeSafeQuery'

function buildTempHistoryPath() {
    return `${mkdtempSync(`${tmpdir()}/playground-history-test-`)}/results/playground-history.json`
}

function validateBlankVersionHoldsTheHardCodedQuery() {
    const version = buildBlankVersion()
    expect('id' in version).toBe(false)
    expect(version.state).toEqual(HARD_CODED_STATE)
    expect(version.questions).toEqual(HARD_CODED_QUESTIONS)
    expect(version.calls).toBe(0)
    expect(version.outputs).toEqual([])
    expect(version.time).toBe(NOT_RUN_TIME)
}

async function validateInitHistoryCreatesAMissingFileWithOneBlankVersion() {
    const historyPath = buildTempHistoryPath()
    await initHistory(historyPath)
    const history = await loadHistory(historyPath)
    expect(history.length).toBe(1)
    expect(history[0].state).toEqual(HARD_CODED_STATE)
}

async function validateInitHistoryKeepsAnExistingFile() {
    const historyPath = buildTempHistoryPath()
    const existing = { time: 'now', state: {}, questions: {}, calls: 1, outputs: [] }
    await writeHistory(historyPath, [existing])
    await initHistory(historyPath)
    expect(await loadHistory(historyPath)).toEqual([existing])
}

async function validateNoTestFileUsesTheRealHistoryFile() {
    // Step: a fresh clone has no results folder, so a test must never use the real history file.
    const realHistoryPathPattern = /HISTORY_PATH|import\.meta\.dir\}\/results/
    const testFilesUsingRealPath: string[] = []
    for await (const testFilePath of new Bun.Glob('**/*.test.ts').scan({ cwd: import.meta.dir })) {
        if (testFilePath.startsWith('node_modules'))
            continue
        if (testFilePath === import.meta.file)
            continue
        const testFileText = await Bun.file(`${import.meta.dir}/${testFilePath}`).text()
        if (realHistoryPathPattern.test(testFileText))
            testFilesUsingRealPath.push(testFilePath)
    }
    // Step: no test file may name the real path.
    expect(testFilesUsingRealPath).toEqual([])
}

test('test_blank_version_holds_the_hard_coded_query', validateBlankVersionHoldsTheHardCodedQuery)
test('test_init_history_creates_a_missing_file_with_one_blank_version', validateInitHistoryCreatesAMissingFileWithOneBlankVersion)
test('test_init_history_keeps_an_existing_file', validateInitHistoryKeepsAnExistingFile)
test('test_no_test_file_uses_the_real_history_file', validateNoTestFileUsesTheRealHistoryFile)
