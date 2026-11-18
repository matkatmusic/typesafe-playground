import { test, expect } from 'bun:test';
import { getHardCodedQuestions, getHardCodedState } from './typeSafeQuery';

function validateStateHoldsOneMessageText() {
    expect(Object.keys(getHardCodedState())).toEqual(['message']);
    expect(getHardCodedState().message).toEqual({ text: 'Please send me the report by Friday.' });
}

function validateQuestionsHoldOneNoulQuestionWithCriteria() {
    expect(Object.keys(getHardCodedQuestions())).toEqual(['requestsAction']);
    const question = getHardCodedQuestions().requestsAction;
    expect(question.type).toBe('noul');
    expect(question).toEqual({
        type: 'noul',
        instructions: 'Does `message.text` ask the reader to do something?',
        criteria: {
            true: 'The message asks the reader to take an action.',
            false: 'The message does not ask the reader to take an action.',
        },
    });
}

test('test_hard_coded_state_holds_one_message_text', validateStateHoldsOneMessageText);
test('test_hard_coded_questions_hold_one_noul_question_with_criteria', validateQuestionsHoldOneNoulQuestionWithCriteria);
