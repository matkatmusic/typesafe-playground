import { test, expect } from 'bun:test';
import { json } from '@codemirror/lang-json';
import { EditorState, Transaction } from '@codemirror/state';
import type { TransactionSpec } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { insertQuestion } from './addQuestion';
import { FILL_ANNOTATION } from './editors';
import { addPlaceholderRanges, findInsertedRanges, listTemplateFieldTexts, placeholderRangesField, readPlaceholderRanges } from './placeholderRanges';

const DOC = '{"a": "one", "b": "two", "c": "three"}';

function buildMarkedState(): EditorState {
  const ranges = findInsertedRanges(DOC, ['one', 'two', 'three'], 0);
  const state = EditorState.create({ doc: DOC, extensions: [placeholderRangesField] });
  return state.update({ effects: addPlaceholderRanges.of(ranges) }).state;
}

function listRangeTexts(state: EditorState): string[] {
  const texts: string[] = [];
  for (const range of readPlaceholderRanges(state))
    texts.push(state.sliceDoc(range.from + 1, range.to - 1));
  return texts;
}

function validateFieldTextsAndInsertedRangesFollowTheTemplate() {
  const texts = listTemplateFieldTexts(',\n"${1:new_noul_1}": {\n  "instructions": "${2:instruction}"\n}');
  expect(texts).toEqual(['new_noul_1', 'instruction']);
  const doc = ',\n  "new_noul_1": {\n    "instructions": "instruction"\n}';
  const ranges = findInsertedRanges(doc, texts, 0);
  expect(doc.slice(ranges[0].from, ranges[0].to)).toBe('"new_noul_1"');
  expect(doc.slice(ranges[1].from, ranges[1].to)).toBe('"instruction"');
}

function validateInsertRegistersEveryPlaceholderRange() {
  const view = { state: EditorState.create({ doc: '{}', extensions: [json(), placeholderRangesField] }), focus: (): void => {} };
  function applyDispatch(spec: Transaction | TransactionSpec): void {
    view.state = (spec instanceof Transaction ? spec : view.state.update(spec)).state;
  }
  Object.assign(view, { dispatch: applyDispatch });
  insertQuestion(view as unknown as EditorView, 'noul');
  expect(listRangeTexts(view.state)).toEqual(['new_noul_1', 'instruction', 'description', 'description']);
}

function validateTypingInsideOneDropsOnlyThatOne() {
  const state = buildMarkedState();
  const typed = state.update({ changes: { from: DOC.indexOf('two') + 1, insert: 'X' } }).state;
  expect(listRangeTexts(typed)).toEqual(['one', 'three']);
  const typedOver = state.update({ changes: { from: DOC.indexOf('one'), to: DOC.indexOf('one') + 3, insert: 'new' } }).state;
  expect(listRangeTexts(typedOver)).toEqual(['two', 'three']);
}

function validateEditsElsewhereMoveTheOtherRanges() {
  const state = buildMarkedState();
  const moved = state.update({ changes: { from: 1, insert: '"x": 1, ' } }).state;
  expect(listRangeTexts(moved)).toEqual(['one', 'two', 'three']);
  const shifted = moved.update({ changes: { from: moved.doc.length - 1, insert: ' ' } }).state;
  expect(listRangeTexts(shifted)).toEqual(['one', 'two', 'three']);
}

function validateFillClearsEveryRange() {
  const state = buildMarkedState();
  const filled = state.update({ changes: { from: 0, to: DOC.length, insert: DOC }, annotations: FILL_ANNOTATION.of(true) }).state;
  expect(readPlaceholderRanges(filled)).toEqual([]);
}

test('test_field_texts_and_inserted_ranges_follow_the_template', validateFieldTextsAndInsertedRangesFollowTheTemplate);
test('test_insert_registers_every_placeholder_range', validateInsertRegistersEveryPlaceholderRange);
test('test_typing_inside_one_drops_only_that_one', validateTypingInsideOneDropsOnlyThatOne);
test('test_edits_elsewhere_move_the_other_ranges', validateEditsElsewhereMoveTheOtherRanges);
test('test_fill_clears_every_range', validateFillClearsEveryRange);
