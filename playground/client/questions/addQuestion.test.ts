import { test, expect } from 'bun:test';
import { snippet } from '@codemirror/autocomplete';
import { json } from '@codemirror/lang-json';
import { syntaxTree } from '@codemirror/language';
import { EditorState, Transaction } from '@codemirror/state';
import type { StateEffectType, TransactionSpec } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { findClosingBracePosition, insertQuestion } from './addQuestion';
import { buildInsertPlan } from './questionSnippets';
import type { QuestionType } from './questionSnippets';

const SCROLL_EFFECT_TYPE = (EditorView.scrollIntoView(0) as unknown as { type: StateEffectType<unknown> }).type;

function runInsert(doc: string, type: QuestionType): string {
  const state = EditorState.create({ doc: doc, extensions: [json()] });
  const plan = buildInsertPlan(syntaxTree(state), doc, type);
  let result = '';
  function saveTransaction(transaction: Transaction): void {
    result = transaction.state.doc.toString();
  }
  snippet(plan.template)({ state: state, dispatch: saveTransaction }, null, plan.from, plan.to);
  return result;
}

function countDispatchesFromInsert(isReadOnly: boolean): number {
  const state = EditorState.create({ doc: '{}', extensions: [json(), EditorState.readOnly.of(isReadOnly)] });
  let dispatchCount = 0;
  function countDispatch(): void {
    dispatchCount++;
  }
  function ignoreFocus(): void {}
  const stubView = { state: state, dispatch: countDispatch, focus: ignoreFocus };
  insertQuestion(stubView as unknown as EditorView, 'noul');
  return dispatchCount;
}

function validateClosingBracePosition() {
  const state = EditorState.create({ doc: '{\n  "a": 1\n}', extensions: [json()] });
  expect(findClosingBracePosition(state)).toBe(11);
  expect(findClosingBracePosition(EditorState.create({ doc: '', extensions: [json()] }))).toBe(null);
}

function validateInsertAfterLastQuestionIsValidJson() {
  const doc = JSON.stringify({ q: { type: 'noul', instructions: 'x', criteria: { true: 'a', false: 'b' } } }, null, 2);
  const types: QuestionType[] = ['noul', 'score', 'choice'];
  for (let i = 0; i < types.length; i++) {
    const parsed = JSON.parse(runInsert(doc, types[i]));
    expect(Object.keys(parsed)).toEqual(['q', 'new_' + types[i] + '_1']);
    expect(parsed['new_' + types[i] + '_1'].type).toBe(types[i]);
  }
}

function validateInsertIntoEmptyObjectIsValidJson() {
  const text = runInsert('{}', 'choice');
  expect(text.startsWith('{\n  "new_choice_1": {\n    "type": "choice",')).toBe(true);
  expect(text.endsWith('\n  }\n}')).toBe(true);
  expect(Object.keys(JSON.parse(text))).toEqual(['new_choice_1']);
}

function validateLockedEditorIgnoresInsert() {
  expect(countDispatchesFromInsert(false)).toBe(2);
  expect(countDispatchesFromInsert(true)).toBe(0);
}

function validateInsertScrollsTheWholeNewQuestionIntoView() {
  const doc = '{\n  "q": {\n    "type": "noul"\n  }\n}';
  const view = { state: EditorState.create({ doc: doc, extensions: [json()] }), scrollRanges: [] as { from: number; to: number; y: string }[], focus: (): void => {} };
  function applyDispatch(spec: Transaction | TransactionSpec): void {
    const transaction = spec instanceof Transaction ? spec : view.state.update(spec);
    for (const effect of transaction.effects) {
      const target = effect.value as { range: { from: number; to: number }; y: string };
      if (effect.is(SCROLL_EFFECT_TYPE))
        view.scrollRanges.push({ from: target.range.from, to: target.range.to, y: target.y });
    }
    view.state = transaction.state;
  }
  Object.assign(view, { dispatch: applyDispatch });
  insertQuestion(view as unknown as EditorView, 'choice');
  const insertedFrom = doc.indexOf('\n  }') + 4;
  expect(view.scrollRanges.length).toBe(1);
  expect(view.scrollRanges[0].y).toBe('nearest');
  expect(view.scrollRanges[0].from).toBe(insertedFrom);
  expect(view.scrollRanges[0].to).toBe(view.state.doc.length - '\n}'.length);
}

test('test_insert_scrolls_the_whole_new_question_into_view', validateInsertScrollsTheWholeNewQuestionIntoView);
test('test_closing_brace_position_comes_from_the_syntax_tree', validateClosingBracePosition);
test('test_insert_after_last_question_gives_valid_json', validateInsertAfterLastQuestionIsValidJson);
test('test_insert_into_empty_object_gives_valid_json', validateInsertIntoEmptyObjectIsValidJson);
test('test_locked_editor_ignores_insert', validateLockedEditorIgnoresInsert);
