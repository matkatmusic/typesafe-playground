import { test, expect } from 'bun:test'
import type { Questions } from '@typesafe-ai/sdk'
import type { RunOutput, Version } from './playgroundHistory'
import { computeVersionStep, isInputUnchanged } from './playgroundVersionStep'
import { HARD_CODED_QUESTIONS, HARD_CODED_STATE } from './typeSafeQuery'

const OTHER_STATE = { message: { text: 'changed' } }
// const OTHER_QUESTIONS = { other: { type: 'noul', instructions: 'x', criteria: { true: 'a', false: 'b' } } }
const OTHER_QUESTIONS = { other: { type: 'noul', instructions: 'x', criteria: { true: 'a', false: 'b' } } } as Questions
const OUTPUT = { answers: {}, usage: { input_tokens: 1, output_tokens: 1 } } as unknown as RunOutput

function buildShown(isStateDefault: boolean, isQuestionsDefault: boolean, hasResults: boolean): Version {
    return {
        time: 't',
        state: isStateDefault ? HARD_CODED_STATE : OTHER_STATE,
        questions: isQuestionsDefault ? HARD_CODED_QUESTIONS : OTHER_QUESTIONS,
        calls: hasResults ? 1 : 0,
        outputs: hasResults ? [OUTPUT] : [],
    }
}

function validateUnchangedInputKeepsTheShownVersion() {
    const shown = buildShown(false, false, false)
    expect(computeVersionStep(shown, shown.state, shown.questions)).toBe('keep')
}

function validateUnchangedInputKeepsEvenWhenTheVersionHasResults() {
    const shown = buildShown(true, true, true)
    expect(computeVersionStep(shown, shown.state, shown.questions)).toBe('keep')
}

function validateIsInputUnchangedComparesStateAndQuestions() {
    const shown = buildShown(false, false, false)
    expect(isInputUnchanged(shown, shown.state, shown.questions)).toBe(true)
    expect(isInputUnchanged(shown, {}, shown.questions)).toBe(false)
    expect(isInputUnchanged(shown, shown.state, {})).toBe(false)
}

// rows: state==default, questions==default, results empty (all yes), edited text: step
function validateRowYesYesYesOverwritesWhenEdited() {
    expect(computeVersionStep(buildShown(true, true, false), OTHER_STATE, HARD_CODED_QUESTIONS)).toBe('overwrite')
}

function validateRowYesNoYesOverwrites() {
    expect(computeVersionStep(buildShown(true, false, false), OTHER_STATE, OTHER_QUESTIONS)).toBe('overwrite')
}

function validateRowNoYesYesOverwrites() {
    expect(computeVersionStep(buildShown(false, true, false), OTHER_STATE, OTHER_QUESTIONS)).toBe('overwrite')
}

function validateRowNoNoYesCreates() {
    expect(computeVersionStep(buildShown(false, false, false), { message: { text: 'again' } }, OTHER_QUESTIONS)).toBe('create')
}

function validateAnyRowWithResultsCreates() {
    for (const isStateDefault of [true, false]) {
        for (const isQuestionsDefault of [true, false])
            expect(computeVersionStep(buildShown(isStateDefault, isQuestionsDefault, true), { message: { text: 'edited' } }, HARD_CODED_QUESTIONS)).toBe('create')
    }
}

test('test_unchanged_input_keeps_the_shown_version', validateUnchangedInputKeepsTheShownVersion)
test('test_unchanged_input_keeps_even_when_the_version_has_results', validateUnchangedInputKeepsEvenWhenTheVersionHasResults)
test('test_is_input_unchanged_compares_state_and_questions', validateIsInputUnchangedComparesStateAndQuestions)
test('test_row_default_default_empty_overwrites_when_edited', validateRowYesYesYesOverwritesWhenEdited)
test('test_row_default_state_other_questions_empty_overwrites', validateRowYesNoYesOverwrites)
test('test_row_other_state_default_questions_empty_overwrites', validateRowNoYesYesOverwrites)
test('test_row_other_state_other_questions_empty_creates', validateRowNoNoYesCreates)
test('test_any_row_with_results_creates', validateAnyRowWithResultsCreates)
