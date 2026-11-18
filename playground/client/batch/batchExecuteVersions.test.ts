import { test, expect, afterEach, describe } from 'bun:test';
import { pageState } from '../page/state';
import { executeSubmitBatch } from './submitBatch';
import { getNotRunTime } from '../../history/notRunTime';
import { getHardCodedState } from '../../providers/typeSafeQuery';
import { getQuestions, buildVersion, installHarness, resetHarness, enableBatch } from './submitBatchHarness.test';
import { getRunIndexes, getRunStates } from './batchExecuteRunReaders';

async function validateVersionFourExampleKeepsTheFirstItemOnVersionFourAndAppendsTheSecond() {
    // Step: version 4 has results and the state {"a":1}, the same questions are in the editor.
    const versions = [buildVersion({ z: 1 }, getQuestions(), 1, 't'), buildVersion({ z: 2 }, getQuestions(), 1, 't'), buildVersion({ z: 3 }, getQuestions(), 1, 't'), buildVersion({ a: 1 }, getQuestions(), 2, 't')];
    const harness = installHarness(versions, 3, '[{"a":1},{"a":2}]', JSON.stringify(getQuestions()), []);
    enableBatch();
    await executeSubmitBatch();
    // Step: one /open holds 5 versions, version 5 is the second item and not run yet.
    expect(harness.openBodies.length).toBe(1);
    expect(harness.openBodies[0].length).toBe(5);
    expect(harness.openBodies[0][4]).toEqual({ time: getNotRunTime(), state: { a: 2 }, questions: getQuestions(), calls: 0, outputs: [] });
    // Step: the runs go to version 4 (index 3) then version 5 (index 4), each with its own state.
    expect(getRunIndexes(harness.runs)).toEqual([3, 4]);
    expect(getRunStates(harness.runs)).toEqual([{ a: 1 }, { a: 2 }]);
    // Step: results for {"a":1} add to version 4.
    expect(pageState.versions[3].calls).toBe(5);
    expect(pageState.versions[4].calls).toBe(3);
    expect(pageState.index).toBe(3);
}

async function validateFirstItemOverwriteReplacesTheShownVersionAndMakesNoNewVersion() {
    const shown = buildVersion(getHardCodedState(), { old: 1 }, 0, getNotRunTime());
    const harness = installHarness([shown], 0, '[{"a":1}]', JSON.stringify(getQuestions()), []);
    enableBatch();
    await executeSubmitBatch();
    expect(harness.openBodies[0].length).toBe(1);
    expect(harness.openBodies[0][0].state).toEqual({ a: 1 });
    expect(harness.openBodies[0][0].questions).toEqual(getQuestions());
    expect(getRunIndexes(harness.runs)).toEqual([0]);
}

async function validateFirstItemCreateMakesANewVersionAtTheEndAndShowsIt() {
    const versions = [buildVersion({ a: 1 }, getQuestions(), 2, 't'), buildVersion({ b: 1 }, getQuestions(), 1, 't')];
    const harness = installHarness(versions, 0, '[{"c":1},{"c":2},{"c":3}]', JSON.stringify(getQuestions()), []);
    enableBatch();
    await executeSubmitBatch();
    expect(harness.openBodies[0].length).toBe(5);
    expect(getRunIndexes(harness.runs)).toEqual([2, 3, 4]);
    expect(pageState.index).toBe(2);
}

function registerBatchExecuteVersionsTests() {
    afterEach(resetHarness);
    test('test_version_four_example_keeps_the_first_item_on_version_four_and_appends_the_second', validateVersionFourExampleKeepsTheFirstItemOnVersionFourAndAppendsTheSecond);
    test('test_first_item_overwrite_replaces_the_shown_version_and_makes_no_new_version', validateFirstItemOverwriteReplacesTheShownVersionAndMakesNoNewVersion);
    test('test_first_item_create_makes_a_new_version_at_the_end_and_shows_it', validateFirstItemCreateMakesANewVersionAtTheEndAndShowsIt);
}

describe('batchExecuteVersions', registerBatchExecuteVersionsTests);
