import { test, expect, afterEach, mock, spyOn } from 'bun:test';
import type { EditorView } from '@codemirror/view';
import * as addQuestion from './addQuestion';
import * as addQuestionMenu from './addQuestionMenu';
import * as editors from './editors';
import { createHeaderAddQuestion, insertPickedQuestion } from './addQuestionHeader';

afterEach(removeFakeState);

function removeFakeState() {
  mock.restore();
  Reflect.deleteProperty(globalThis, 'document');
}

function validatePickedQuestionIsInsertedIntoTheQuestionsEditor() {
  const view = { id: 'questions editor' } as unknown as EditorView;
  spyOn(editors, 'getQuestionsEditor').mockReturnValue(view);
  const insertSpy = spyOn(addQuestion, 'insertQuestion').mockImplementation(() => {});
  insertPickedQuestion('score');
  expect(insertSpy.mock.calls).toEqual([[view, 'score']]);
}

function validateHeaderButtonReusesTheSameMenuElementAndInsertFunction() {
  const slot = { appended: [] as unknown[], append(child: unknown) { slot.appended.push(child); } };
  Object.assign(globalThis, { document: { getElementById: () => slot } });
  const menuElement = { id: 'menu element' } as unknown as HTMLElement;
  const createSpy = spyOn(addQuestionMenu, 'createAddQuestionElement').mockReturnValue(menuElement);
  createHeaderAddQuestion();
  expect(createSpy.mock.calls).toEqual([[insertPickedQuestion]]);
  expect(slot.appended).toEqual([menuElement]);
}

test('test_picked_question_is_inserted_into_the_questions_editor', validatePickedQuestionIsInsertedIntoTheQuestionsEditor);
test('test_header_button_reuses_the_same_menu_element_and_insert_function', validateHeaderButtonReusesTheSameMenuElementAndInsertFunction);
