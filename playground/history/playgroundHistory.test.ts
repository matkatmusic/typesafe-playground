import { test, expect } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { buildBlankVersion, initHistory, loadHistory, writeHistory } from './playgroundHistory';
import { getNotRunTime } from './notRunTime';
import { getHardCodedQuestions, getHardCodedState } from '../providers/typeSafeQuery';

function buildTempHistoryPath() {
    return `${mkdtempSync(`${tmpdir()}/playground-history-test-`)}/results/playground-history.json`;
}

function validateBlankVersionHoldsTheHardCodedQuery() {
    const version = buildBlankVersion();
    expect('id' in version).toBe(false);
    expect(version.state).toEqual(getHardCodedState());
    expect(version.questions).toEqual(getHardCodedQuestions());
    expect(version.calls).toBe(0);
    expect(version.outputs).toEqual([]);
    expect(version.time).toBe(getNotRunTime());
}

async function validateInitHistoryCreatesAMissingFileWithOneBlankVersion() {
    const historyPath = buildTempHistoryPath();
    await initHistory(historyPath);
    const history = await loadHistory(historyPath);
    expect(history.length).toBe(1);
    expect(history[0].state).toEqual(getHardCodedState());
}

async function validateInitHistoryKeepsAnExistingFile() {
    const historyPath = buildTempHistoryPath();
    const existing = { time: 'now', state: {}, questions: {}, calls: 1, outputs: [] };
    await writeHistory(historyPath, [existing]);
    await initHistory(historyPath);
    expect(await loadHistory(historyPath)).toEqual([existing]);
}

async function validateNoTestFileUsesTheRealHistoryFile() {
    const realHistoryPathPattern = /HISTORY_PATH|getHistoryPath|import\.meta\.dir\}\/results/;
    const testFilesUsingRealPath: string[] = [];
    for await (const testFilePath of new Bun.Glob('**/*.test.ts').scan({ cwd: `${import.meta.dir}/..` })) {
        const isInNodeModules = testFilePath.startsWith('node_modules');
        if (isInNodeModules)
            continue;
        if (testFilePath === `history/${import.meta.file}`)
            continue;
        const namesRealHistoryPath = realHistoryPathPattern.test(await Bun.file(`${import.meta.dir}/../${testFilePath}`).text());
        if (namesRealHistoryPath)
            testFilesUsingRealPath.push(testFilePath);
    }
    expect(testFilesUsingRealPath).toEqual([]);
}

test('test_blank_version_holds_the_hard_coded_query', validateBlankVersionHoldsTheHardCodedQuery);
test('test_init_history_creates_a_missing_file_with_one_blank_version', validateInitHistoryCreatesAMissingFileWithOneBlankVersion);
test('test_init_history_keeps_an_existing_file', validateInitHistoryKeepsAnExistingFile);
test('test_no_test_file_uses_the_real_history_file', validateNoTestFileUsesTheRealHistoryFile);
