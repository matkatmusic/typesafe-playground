import { test, expect } from 'bun:test';
import { getChoiceQuestion, getChoiceAnswers, getNoulQuestion, getNoulAnswers } from './infoRowsFixtures';

function validateChoiceQuestionHasTwoCriteria() {
    // The choice question has type choice and criteria a and b.
    const choiceQuestion = getChoiceQuestion();
    expect(choiceQuestion).toEqual({ type: 'choice', criteria: { a: 'first', b: 'second' } });
}

function validateChoiceAnswersPickEachCriterion() {
    // Two choice answers: the first picks a, the second picks b.
    const choiceAnswers = getChoiceAnswers();
    expect(choiceAnswers.length).toBe(2);
    expect(choiceAnswers[0]).toEqual({ type: 'choice', choice: 'a', confidence: 0.5, probabilities: { a: 0.6, b: 0.4 } });
    expect(choiceAnswers[1]).toEqual({ type: 'choice', choice: 'b', confidence: 0.7, probabilities: { a: 0.2, b: 0.8 } });
}

function validateNoulQuestionHasTrueAndFalseCriteria() {
    // The noul question has type noul and criteria true and false.
    const noulQuestion = getNoulQuestion();
    expect(noulQuestion).toEqual({ type: 'noul', criteria: { true: 'is yes', false: 'is no' } });
}

function validateNoulAnswersHoldTwoValues() {
    // Two noul answers with values 0.8 and 0.3.
    const noulAnswers = getNoulAnswers();
    expect(noulAnswers).toEqual([{ type: 'noul', noul: 0.8 }, { type: 'noul', noul: 0.3 }]);
}

test('test_choice_question_has_two_criteria', validateChoiceQuestionHasTwoCriteria);
test('test_choice_answers_pick_each_criterion', validateChoiceAnswersPickEachCriterion);
test('test_noul_question_has_true_and_false_criteria', validateNoulQuestionHasTrueAndFalseCriteria);
test('test_noul_answers_hold_two_values', validateNoulAnswersHoldTwoValues);
