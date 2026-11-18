import type { JsonValue, Questions } from '@typesafe-ai/sdk';

export function getHardCodedState(): Record<string, JsonValue> {
    return {
        message: { text: 'Please send me the report by Friday.' },
    };
}

export function getHardCodedQuestions(): Questions {
    return {
        requestsAction: {
            type: 'noul',
            instructions: 'Does `message.text` ask the reader to do something?',
            criteria: {
                true: 'The message asks the reader to take an action.',
                false: 'The message does not ask the reader to take an action.',
            },
        },
    };
}
