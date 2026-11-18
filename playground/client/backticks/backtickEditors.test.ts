import { test, expect } from 'bun:test';
import { EditorState } from '@codemirror/state';
import type { StateEffect, TransactionSpec } from '@codemirror/state';
import type { EditorView, ViewUpdate } from '@codemirror/view';
import { buildOtherEditorRelint, isOtherEditorChanged, listBothEditorStates } from './backtickEditors';

function createFakeView(specs: TransactionSpec[]): EditorView {
  return { dispatch(spec: TransactionSpec) {
    specs.push(spec);
  } } as unknown as EditorView;
}

function createFakeUpdate(view: EditorView, docChanged: boolean): ViewUpdate {
  return { docChanged: docChanged, view: view } as unknown as ViewUpdate;
}

function createUpdateFromSpec(spec: TransactionSpec): ViewUpdate {
  const transaction = EditorState.create({}).update(spec);
  return { transactions: [transaction] } as unknown as ViewUpdate;
}

function validateListBothEditorStatesThrowsBeforeEditorsExist() {
  expect(() => listBothEditorStates()).toThrow('state editor is not created yet');
}

function validateRelintGoesOnlyToTheOtherViewOnDocChange() {
  const firstSpecs: TransactionSpec[] = [];
  const secondSpecs: TransactionSpec[] = [];
  const firstView = createFakeView(firstSpecs);
  const secondView = createFakeView(secondSpecs);
  const relint = buildOtherEditorRelint(() => [firstView, secondView]);
  relint(createFakeUpdate(firstView, false));
  expect(secondSpecs.length).toBe(0);
  relint(createFakeUpdate(firstView, true));
  expect(firstSpecs.length).toBe(0);
  expect(secondSpecs.length).toBe(1);
  expect(isOtherEditorChanged(createUpdateFromSpec(secondSpecs[0]))).toBe(true);
}

function validatePlainTransactionIsNotAnOtherEditorChange() {
  expect(isOtherEditorChanged(createUpdateFromSpec({ changes: { from: 0, insert: 'x' } }))).toBe(false);
  expect(isOtherEditorChanged(createUpdateFromSpec({ effects: [] as StateEffect<unknown>[] }))).toBe(false);
}

test('test_list_both_editor_states_throws_before_editors_exist', validateListBothEditorStatesThrowsBeforeEditorsExist);
test('test_relint_goes_only_to_the_other_view_on_doc_change', validateRelintGoesOnlyToTheOtherViewOnDocChange);
test('test_plain_transaction_is_not_an_other_editor_change', validatePlainTransactionIsNotAnOtherEditorChange);
