import { test, expect } from 'bun:test';
import { json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import type { StateEffect, TransactionSpec } from '@codemirror/state';
import type { EditorView, ViewUpdate } from '@codemirror/view';
import { buildOtherEditorRelint, buildUndefinedNameSource, isOtherEditorChanged } from './backtickCompletion';

function createJsonState(text: string): EditorState {
  return EditorState.create({ doc: text, extensions: [json()] });
}

function createFakeView(specs: TransactionSpec[]): EditorView {
  return { dispatch(spec: TransactionSpec) { specs.push(spec); } } as unknown as EditorView;
}

function createFakeUpdate(view: EditorView, docChanged: boolean): ViewUpdate {
  return { docChanged: docChanged, view: view } as unknown as ViewUpdate;
}

function createUpdateFromSpec(spec: TransactionSpec): ViewUpdate {
  const transaction = EditorState.create({}).update(spec);
  return { transactions: [transaction] } as unknown as ViewUpdate;
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

function validateRenamedKeyGetsSquiggleInTheQuestionsEditor() {
  const questionsText = '{"instructions": "Does `message.text` ask the reader to do something?"}';
  const questionsState = createJsonState(questionsText);
  const view = { state: questionsState } as unknown as EditorView;
  const renamedState = createJsonState('{"userMessage": {"text": "Please send me the report by Friday."}}');
  const originalState = createJsonState('{"message": {"text": "Please send me the report by Friday."}}');
  const renamedSource = buildUndefinedNameSource(() => [renamedState, questionsState]);
  const originalSource = buildUndefinedNameSource(() => [originalState, questionsState]);
  const nameFrom = questionsText.indexOf('message.text');
  expect(renamedSource(view)).toEqual([
    { from: nameFrom, to: nameFrom + 'message.text'.length, severity: 'error', message: 'message.text is not defined in either JSON editor' },
  ]);
  expect(originalSource(view)).toEqual([]);
}

function validateArrayIndexNamesAreDefinedOnlyInsideTheArray() {
  const questionsText = '{"q": {"criteria": {"0": "`userMessageArray[0]`", "1": "`userMessageArray[1]`", "x": "`userMessageArray[2]` `q.criteria.0` `userMessageArray.0`"}}}';
  const questionsState = createJsonState(questionsText);
  const view = { state: questionsState } as unknown as EditorView;
  const stateState = createJsonState('{"userMessageArray": ["a", "b"]}');
  const diagnostics = buildUndefinedNameSource(() => [stateState, questionsState])(view);
  const outOfRangeFrom = questionsText.indexOf('userMessageArray[2]');
  const dotStepFrom = questionsText.indexOf('userMessageArray.0');
  expect(diagnostics).toEqual([
    { from: outOfRangeFrom, to: outOfRangeFrom + 'userMessageArray[2]'.length, severity: 'error', message: 'userMessageArray[2] is not defined in either JSON editor' },
    { from: dotStepFrom, to: dotStepFrom + 'userMessageArray.0'.length, severity: 'error', message: 'userMessageArray.0 is not defined in either JSON editor' },
  ]);
}

test('test_array_index_names_are_defined_only_inside_the_array', validateArrayIndexNamesAreDefinedOnlyInsideTheArray);
test('test_relint_goes_only_to_the_other_view_on_doc_change',validateRelintGoesOnlyToTheOtherViewOnDocChange);
test('test_plain_transaction_is_not_an_other_editor_change', validatePlainTransactionIsNotAnOtherEditorChange);
test('test_renamed_key_gets_squiggle_in_the_questions_editor', validateRenamedKeyGetsSquiggleInTheQuestionsEditor);
