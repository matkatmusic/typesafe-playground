import type { JsonValue, Questions } from '@typesafe-ai/sdk';

export const HARD_CODED_STATE: Record<string, JsonValue> = {
  message: { text: 'Please send me the report by Friday.' },
};

export const HARD_CODED_QUESTIONS: Questions = {
  requestsAction: {
    type: 'noul',
    instructions: 'Does `message.text` ask the reader to do something?',
    criteria: {
      true: 'The message asks the reader to take an action.',
      false: 'The message does not ask the reader to take an action.',
    },
  },
};
