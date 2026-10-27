import { test, expect } from 'bun:test';
import { snippet } from '@codemirror/autocomplete';
import { json } from '@codemirror/lang-json';
import { syntaxTree } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import type { Transaction } from '@codemirror/state';
import type { DecorationSet } from '@codemirror/view';
import { buildPlaceholderDecorations, createPlaceholders, findPlaceholderRanges, placeholderField } from './placeholders';
import { buildInsertPlan } from './questionSnippets';

function buildChoiceInsertText(): string {
  const state = EditorState.create({ doc: '{}', extensions: [json()] });
  const plan = buildInsertPlan(syntaxTree(state), '{}', 'choice');
  let result = '';
  function saveTransaction(transaction: Transaction): void {
    result = transaction.state.doc.toString();
  }
  snippet(plan.template)({ state: state, dispatch: saveTransaction }, null, plan.from, plan.to);
  return result;
}

function listRangeTexts(text: string): string[] {
  const ranges = findPlaceholderRanges(text);
  const texts: string[] = [];
  for (let i = 0; i < ranges.length; i++)
    texts.push(text.slice(ranges[i].from + 1, ranges[i].to - 1));
  return texts;
}

function validatePlaceholdersSurviveTypingOverOne() {
  const text = buildChoiceInsertText();
  const before = listRangeTexts(text);
  expect(before).toEqual([
    'new_choice_1',
    'Which option best fits the state?',
    'option_a',
    'Description of an option',
    'option_b',
    'Another description of a distinct option',
    'option_c',
    'Another mutually exclusive option',
  ]);
  const ranges = findPlaceholderRanges(text);
  expect(ranges.length).toBe(8);
  const typed = text.slice(0, ranges[3].from + 1) + 'real text' + text.slice(ranges[3].to - 1);
  const after = listRangeTexts(typed);
  expect(after.length).toBe(7);
  expect(after.includes('Description of an option')).toBe(false);
  expect(after.includes('option_a')).toBe(true);
  expect(after.includes('new_choice_1')).toBe(true);
}

function validateGeneratedNamesAndDefaultsAreFoundButUserTextIsNot() {
  const text = '{"new_noul_7": {"instructions": "instruction", "x": "mine"}}';
  const found = findPlaceholderRanges(text);
  expect(found.length).toBe(2);
  expect(text.slice(found[0].from, found[0].to)).toBe('"new_noul_7"');
  expect(text.slice(found[1].from, found[1].to)).toBe('"instruction"');
}

function validateEscapedQuoteDoesNotEndTheString() {
  expect(findPlaceholderRanges('{"a": "x\\"y", "b": "description"}').length).toBe(1);
}

function listMarkClasses(state: EditorState): string[] {
  return listDecorationClasses(buildPlaceholderDecorations(state));
}

function listDecorationClasses(decorations: DecorationSet): string[] {
  const classes: string[] = [];
  const cursor = decorations.iter();
  while (cursor.value !== null) {
    classes.push(cursor.value.spec.class);
    cursor.next();
  }
  return classes;
}

function validateOnlyAFullySelectedPlaceholderGetsTheSelectedClass() {
  const doc = '{"a": "instruction", "b": "description"}';
  const first = findPlaceholderRanges(doc)[0];
  const plain = 'cm-placeholderValue';
  const selected = 'cm-placeholderValue cm-placeholderSelected';
  const cursorOnly = EditorState.create({ doc: doc, selection: { anchor: first.from + 3 } });
  expect(listMarkClasses(cursorOnly)).toEqual([plain, plain]);
  const partial = EditorState.create({ doc: doc, selection: { anchor: first.from + 2, head: first.to - 1 } });
  expect(listMarkClasses(partial)).toEqual([plain, plain]);
  const inner = EditorState.create({ doc: doc, selection: { anchor: first.from + 1, head: first.to - 1 } });
  expect(listMarkClasses(inner)).toEqual([selected, plain]);
}

function validateSelectionChangeAloneRebuildsTheDecorations() {
  const doc = '{"a": "instruction"}';
  const range = findPlaceholderRanges(doc)[0];
  const state = EditorState.create({ doc: doc, extensions: [createPlaceholders()] });
  expect(listDecorationClasses(state.field(placeholderField))).toEqual(['cm-placeholderValue']);
  const selection = { anchor: range.from + 1, head: range.to - 1 };
  const moved = state.update({ selection: selection }).state;
  expect(listDecorationClasses(moved.field(placeholderField))).toEqual(['cm-placeholderValue cm-placeholderSelected']);
}

test('test_only_a_fully_selected_placeholder_gets_the_selected_class', validateOnlyAFullySelectedPlaceholderGetsTheSelectedClass);
test('test_selection_change_alone_rebuilds_the_decorations', validateSelectionChangeAloneRebuildsTheDecorations);
test('test_placeholders_stay_found_after_typing_over_one',validatePlaceholdersSurviveTypingOverOne);
test('test_generated_names_and_defaults_are_found', validateGeneratedNamesAndDefaultsAreFoundButUserTextIsNot);
test('test_escaped_quote_does_not_end_the_string', validateEscapedQuoteDoesNotEndTheString);
