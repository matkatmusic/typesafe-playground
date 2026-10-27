import { test, expect } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { buildBlankVersion, initHistory, loadHistory, writeHistory } from './playgroundHistory'
import { HARD_CODED_QUESTIONS, HARD_CODED_STATE } from './typeSafeQuery'

function buildTempHistoryPath() {
    return `${mkdtempSync(`${tmpdir()}/playground-history-test-`)}/results/playground-history.json`
}

function validateBlankVersionHoldsTheHardCodedQuery() {
    const version = buildBlankVersion()
    expect(version.id).toBe(1)
    expect(version.state).toEqual(HARD_CODED_STATE)
    expect(version.questions).toEqual(HARD_CODED_QUESTIONS)
    expect(version.calls).toBe(0)
    expect(version.outputs).toEqual([])
}

async function validateInitHistoryCreatesAMissingFileWithOneBlankVersion() {
    const historyPath = buildTempHistoryPath()
    await initHistory(historyPath)
    const history = await loadHistory(historyPath)
    expect(history.length).toBe(1)
    expect(history[0].id).toBe(1)
    expect(history[0].state).toEqual(HARD_CODED_STATE)
}

async function validateInitHistoryKeepsAnExistingFile() {
    const historyPath = buildTempHistoryPath()
    const existing = { id: 5, time: 'now', state: {}, questions: {}, calls: 1, outputs: [] }
    await writeHistory(historyPath, [existing])
    await initHistory(historyPath)
    expect(await loadHistory(historyPath)).toEqual([existing])
}

test('test_blank_version_holds_the_hard_coded_query', validateBlankVersionHoldsTheHardCodedQuery)
test('test_init_history_creates_a_missing_file_with_one_blank_version', validateInitHistoryCreatesAMissingFileWithOneBlankVersion)
test('test_init_history_keeps_an_existing_file', validateInitHistoryKeepsAnExistingFile)
