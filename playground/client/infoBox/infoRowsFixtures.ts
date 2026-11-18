import type { Question } from '@typesafe-ai/sdk';
import type { Answer } from '../graphs/graphTypes';

export function getChoiceQuestion(): Question {
    return { type: 'choice', criteria: { a: 'first', b: 'second' } };
}

export function getChoiceAnswers(): Answer[] {
    return [
        { type: 'choice', choice: 'a', confidence: 0.5, probabilities: { a: 0.6, b: 0.4 } },
        { type: 'choice', choice: 'b', confidence: 0.7, probabilities: { a: 0.2, b: 0.8 } },
    ];
}

export function getNoulQuestion(): Question {
    return { type: 'noul', criteria: { true: 'is yes', false: 'is no' } };
}

export function getNoulAnswers(): Answer[] {
    return [{ type: 'noul', noul: 0.8 }, { type: 'noul', noul: 0.3 }];
}
