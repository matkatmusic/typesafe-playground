import { insertQuestion } from './addQuestion';
import { createAddQuestionElement } from './addQuestionMenu';
import { getElement } from './dom';
import { getQuestionsEditor } from './editors';
import type { QuestionType } from './questionSnippets';

export function insertPickedQuestion(type: QuestionType): void {
  insertQuestion(getQuestionsEditor(), type);
}

export function createHeaderAddQuestion(): void {
  getElement('questionsAddQuestion').append(createAddQuestionElement(insertPickedQuestion));
}
