import { test, expect } from 'bun:test'
import { HARD_CODED_QUESTIONS, HARD_CODED_STATE } from './typeSafeQuery'

function validateStateHoldsOneMessageText() {
    expect(Object.keys(HARD_CODED_STATE)).toEqual(['message'])
    expect(HARD_CODED_STATE.message).toEqual({ text: 'Please send me the report by Friday.' })
}

function validateQuestionsHoldOneNoulQuestionWithCriteria() {
    expect(Object.keys(HARD_CODED_QUESTIONS)).toEqual(['requestsAction'])
    const question = HARD_CODED_QUESTIONS.requestsAction
    expect(question.type).toBe('noul')
    expect(question).toEqual({
        type: 'noul',
        instructions: 'Does `message.text` ask the reader to do something?',
        criteria: {
            true: 'The message asks the reader to take an action.',
            false: 'The message does not ask the reader to take an action.',
        },
    })
}

test('test_hard_coded_state_holds_one_message_text', validateStateHoldsOneMessageText)
test('test_hard_coded_questions_hold_one_noul_question_with_criteria', validateQuestionsHoldOneNoulQuestionWithCriteria)
