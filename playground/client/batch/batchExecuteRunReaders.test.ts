import { test, expect, describe } from 'bun:test';
import { getQuestions } from './submitBatchHarness.test';
import { getRunIndexes, getRunStates, getRunCalls, getRunButtonTexts, isEveryRunUsingTheQuestions, isEveryRunLockingTheControls, isEveryRunShowingIndex } from './batchExecuteRunReaders';
import type { Runs } from './batchExecuteRunReaders';

function buildRun(index: number, overrides: Partial<Runs[number]> = {}): Runs[number] {
    return { index, calls: index + 10, state: { a: index }, questions: getQuestions(), buttonText: `button ${index}`, isButtonDisabled: true, isToggleDisabled: true, isNewDisabled: true, areEditorsLocked: true, shownIndex: 2, ...overrides };
}

function validateGetRunIndexesListsEachRunIndex() {
    // Step: two runs have indexes 3 and 5.
    const runs = [buildRun(3), buildRun(5)];
    // Step: the reader lists the indexes in run order.
    expect(getRunIndexes(runs)).toEqual([3, 5]);
}

function validateGetRunStatesListsEachRunState() {
    const runs = [buildRun(1), buildRun(2)];
    expect(getRunStates(runs)).toEqual([{ a: 1 }, { a: 2 }]);
}

function validateGetRunCallsListsEachRunCallCount() {
    const runs = [buildRun(1), buildRun(2)];
    expect(getRunCalls(runs)).toEqual([11, 12]);
}

function validateGetRunButtonTextsListsEachRunButtonText() {
    const runs = [buildRun(1), buildRun(2)];
    expect(getRunButtonTexts(runs)).toEqual(['button 1', 'button 2']);
}

function validateReadersReturnEmptyListsForNoRuns() {
    expect(getRunIndexes([])).toEqual([]);
    expect(getRunStates([])).toEqual([]);
    expect(getRunCalls([])).toEqual([]);
    expect(getRunButtonTexts([])).toEqual([]);
}

function validateIsEveryRunUsingTheQuestionsIsTrueWhenAllRunsHaveTheQuestions() {
    const runs = [buildRun(1), buildRun(2)];
    expect(isEveryRunUsingTheQuestions(runs)).toBe(true);
}

function validateIsEveryRunUsingTheQuestionsIsFalseWhenOneRunHasOtherQuestions() {
    // Step: the second run has different questions.
    const runs = [buildRun(1), buildRun(2, { questions: { other: 1 } })];
    expect(isEveryRunUsingTheQuestions(runs)).toBe(false);
}

function validateIsEveryRunLockingTheControlsIsTrueWhenAllControlsAreLocked() {
    const runs = [buildRun(1), buildRun(2)];
    expect(isEveryRunLockingTheControls(runs)).toBe(true);
}

function validateIsEveryRunLockingTheControlsIsFalseWhenTheButtonIsEnabled() {
    const runs = [buildRun(1), buildRun(2, { isButtonDisabled: false })];
    expect(isEveryRunLockingTheControls(runs)).toBe(false);
}

function validateIsEveryRunLockingTheControlsIsFalseWhenTheToggleIsEnabled() {
    const runs = [buildRun(1, { isToggleDisabled: false })];
    expect(isEveryRunLockingTheControls(runs)).toBe(false);
}

function validateIsEveryRunLockingTheControlsIsFalseWhenTheNewButtonIsEnabled() {
    const runs = [buildRun(1, { isNewDisabled: false })];
    expect(isEveryRunLockingTheControls(runs)).toBe(false);
}

function validateIsEveryRunLockingTheControlsIsFalseWhenTheEditorsAreUnlocked() {
    const runs = [buildRun(1, { areEditorsLocked: false })];
    expect(isEveryRunLockingTheControls(runs)).toBe(false);
}

function validateIsEveryRunShowingIndexIsTrueWhenAllRunsShowThatIndex() {
    const runs = [buildRun(1), buildRun(2)];
    expect(isEveryRunShowingIndex(runs, 2)).toBe(true);
}

function validateIsEveryRunShowingIndexIsFalseWhenOneRunShowsAnotherIndex() {
    const runs = [buildRun(1), buildRun(2, { shownIndex: 0 })];
    expect(isEveryRunShowingIndex(runs, 2)).toBe(false);
}

function registerRunReaderTests() {
    test('test_get_run_indexes_lists_each_run_index', validateGetRunIndexesListsEachRunIndex);
    test('test_get_run_states_lists_each_run_state', validateGetRunStatesListsEachRunState);
    test('test_get_run_calls_lists_each_run_call_count', validateGetRunCallsListsEachRunCallCount);
    test('test_get_run_button_texts_lists_each_run_button_text', validateGetRunButtonTextsListsEachRunButtonText);
    test('test_readers_return_empty_lists_for_no_runs', validateReadersReturnEmptyListsForNoRuns);
}

function registerRunPredicateTests() {
    test('test_is_every_run_using_the_questions_is_true_when_all_runs_have_the_questions', validateIsEveryRunUsingTheQuestionsIsTrueWhenAllRunsHaveTheQuestions);
    test('test_is_every_run_using_the_questions_is_false_when_one_run_has_other_questions', validateIsEveryRunUsingTheQuestionsIsFalseWhenOneRunHasOtherQuestions);
    test('test_is_every_run_locking_the_controls_is_true_when_all_controls_are_locked', validateIsEveryRunLockingTheControlsIsTrueWhenAllControlsAreLocked);
    test('test_is_every_run_locking_the_controls_is_false_when_the_button_is_enabled', validateIsEveryRunLockingTheControlsIsFalseWhenTheButtonIsEnabled);
    test('test_is_every_run_locking_the_controls_is_false_when_the_toggle_is_enabled', validateIsEveryRunLockingTheControlsIsFalseWhenTheToggleIsEnabled);
    test('test_is_every_run_locking_the_controls_is_false_when_the_new_button_is_enabled', validateIsEveryRunLockingTheControlsIsFalseWhenTheNewButtonIsEnabled);
    test('test_is_every_run_locking_the_controls_is_false_when_the_editors_are_unlocked', validateIsEveryRunLockingTheControlsIsFalseWhenTheEditorsAreUnlocked);
    test('test_is_every_run_showing_index_is_true_when_all_runs_show_that_index', validateIsEveryRunShowingIndexIsTrueWhenAllRunsShowThatIndex);
    test('test_is_every_run_showing_index_is_false_when_one_run_shows_another_index', validateIsEveryRunShowingIndexIsFalseWhenOneRunShowsAnotherIndex);
}

describe('batch execute run readers', registerRunReaderTests);
describe('batch execute run predicates', registerRunPredicateTests);
