import { test, expect } from 'bun:test'
import type { Version } from '../playgroundHistory'
import { NOT_RUN_TIME } from '../notRunTime'
import { HARD_CODED_STATE } from '../typeSafeQuery'
import { buildBatchVersions, computeBatchStateError, formatBatchFailures } from './batchPlan'

function buildVersion(state: unknown, questions: unknown, outputCount: number): Version {
    const outputs = []
    for (let i = 0; i < outputCount; i++)
        outputs.push({ answers: {}, usage: { input_tokens: 1, output_tokens: 1 } })
    return { time: 't', state, questions, calls: outputCount, outputs } as unknown as Version
}

function validateStateThatIsNotAnArrayGivesAnError() {
    // Step: give an object, a number and null to the check.
    // Step: each one gives the not-an-array error.
    expect(computeBatchStateError({ a: 1 })).toBe('state must be an array of objects while batch is on')
    expect(computeBatchStateError(3)).toBe('state must be an array of objects while batch is on')
    expect(computeBatchStateError(null)).toBe('state must be an array of objects while batch is on')
}

function validateEmptyArrayGivesAnError() {
    expect(computeBatchStateError([])).toBe('the state array is empty: add at least one object')
}

function validateItemThatIsNotAPlainObjectGivesAnErrorNamingTheItem() {
    // Step: an array item can be a number, null, an array or a string.
    // Step: the error names the item number, counting from 1.
    expect(computeBatchStateError([{ a: 1 }, 2])).toBe('item 2 of the state array must be a JSON object')
    expect(computeBatchStateError([null])).toBe('item 1 of the state array must be a JSON object')
    expect(computeBatchStateError([{}, {}, [1]])).toBe('item 3 of the state array must be a JSON object')
    expect(computeBatchStateError(['x'])).toBe('item 1 of the state array must be a JSON object')
}

function validateArrayOfObjectsGivesNoError() {
    expect(computeBatchStateError([{ a: 1 }, {}])).toBeNull()
}

function validateKeepUsesTheShownVersionForTheFirstItemAndAppendsTheRest() {
    // Step: version 4 has results and the state {"a":1}.
    // Step: the batch is [{"a":1},{"a":2}] with the same questions.
    const questions = { q: 1 }
    const versions = [buildVersion({ z: 1 }, questions, 1), buildVersion({ z: 2 }, questions, 1), buildVersion({ z: 3 }, questions, 1), buildVersion({ a: 1 }, questions, 2)]
    const plan = buildBatchVersions(versions, 3, [{ a: 1 }, { a: 2 }], questions)
    // Step: the results for {"a":1} go on version 4, and {"a":2} becomes version 5.
    expect(plan.itemIndexes).toEqual([3, 4])
    expect(plan.versions.length).toBe(5)
    expect(plan.versions[3]).toBe(versions[3])
    expect(plan.versions[4]).toEqual({ time: NOT_RUN_TIME, state: { a: 2 }, questions: questions, calls: 0, outputs: [] })
}

function validateOverwriteReplacesStateAndQuestionsOnTheShownVersion() {
    // Step: the shown version has the default state, no results and different questions.
    const shown = buildVersion(HARD_CODED_STATE, { oldQ: 1 }, 0)
    shown.questionsNote = 'keep me'
    const versions = [shown]
    const plan = buildBatchVersions(versions, 0, [{ a: 1 }, { a: 2 }], { newQ: 1 })
    // Step: the first item replaces the shown version and keeps its notes.
    expect(plan.itemIndexes).toEqual([0, 1])
    expect(plan.versions[0]).toEqual({ ...shown, state: { a: 1 }, questions: { newQ: 1 } })
    expect(plan.versions[1].state).toEqual({ a: 2 })
    expect(plan.versions[1].questions).toEqual({ newQ: 1 })
}

function validateCreateMakesTheFirstItemANewVersionAtTheEnd() {
    // Step: the shown version has results and other state.
    const shown = buildVersion({ old: 1 }, { q: 1 }, 2)
    const other = buildVersion({ other: 1 }, { q: 1 }, 1)
    const versions = [shown, other]
    const plan = buildBatchVersions(versions, 0, [{ a: 1 }, { a: 2 }, { a: 3 }], { q: 1 })
    // Step: all three items are new versions at the end, in array order.
    expect(plan.itemIndexes).toEqual([2, 3, 4])
    expect(plan.versions.length).toBe(5)
    expect(plan.versions[0]).toBe(shown)
    expect(plan.versions[2].state).toEqual({ a: 1 })
    expect(plan.versions[4].state).toEqual({ a: 3 })
    expect(plan.versions[2].time).toBe(NOT_RUN_TIME)
}

function validateLaterItemsAreAlwaysNewEvenWhenTheyMatchAnotherVersion() {
    const questions = { q: 1 }
    const versions = [buildVersion({ a: 1 }, questions, 1), buildVersion({ a: 2 }, questions, 1)]
    const plan = buildBatchVersions(versions, 0, [{ a: 1 }, { a: 2 }], questions)
    expect(plan.itemIndexes).toEqual([0, 2])
    expect(plan.versions.length).toBe(3)
}

function validateEveryItemGetsItsOwnCopyOfTheQuestions() {
    const questions = { q: { r: 1 } }
    const plan = buildBatchVersions([buildVersion({ a: 1 }, { q: 0 }, 1)], 0, [{ a: 2 }, { a: 3 }], questions)
    expect(plan.versions[1].questions).toEqual(questions)
    expect(plan.versions[1].questions).not.toBe(plan.versions[2].questions)
}

function validateFailuresAreListedOneLineEach() {
    expect(formatBatchFailures(['version 2: Run failed: 500 boom', 'version 4: Run failed: 400 bad'])).toBe('Some runs failed:\nversion 2: Run failed: 500 boom\nversion 4: Run failed: 400 bad')
}

test('test_state_that_is_not_an_array_gives_an_error', validateStateThatIsNotAnArrayGivesAnError)
test('test_empty_array_gives_an_error', validateEmptyArrayGivesAnError)
test('test_item_that_is_not_a_plain_object_gives_an_error_naming_the_item', validateItemThatIsNotAPlainObjectGivesAnErrorNamingTheItem)
test('test_array_of_objects_gives_no_error', validateArrayOfObjectsGivesNoError)
test('test_keep_uses_the_shown_version_for_the_first_item_and_appends_the_rest', validateKeepUsesTheShownVersionForTheFirstItemAndAppendsTheRest)
test('test_overwrite_replaces_state_and_questions_on_the_shown_version', validateOverwriteReplacesStateAndQuestionsOnTheShownVersion)
test('test_create_makes_the_first_item_a_new_version_at_the_end', validateCreateMakesTheFirstItemANewVersionAtTheEnd)
test('test_later_items_are_always_new_even_when_they_match_another_version', validateLaterItemsAreAlwaysNewEvenWhenTheyMatchAnotherVersion)
test('test_every_item_gets_its_own_copy_of_the_questions', validateEveryItemGetsItsOwnCopyOfTheQuestions)
test('test_failures_are_listed_one_line_each', validateFailuresAreListedOneLineEach)
