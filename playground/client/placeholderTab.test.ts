import { test, expect } from 'bun:test';
import { json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { createPlaceholderTab, selectNextPlaceholder, selectPreviousPlaceholder } from './placeholderTab';

const DOC = '{\n  "new_noul_1": {\n    "type": "noul",\n    "instructions": "instruction",\n    "criteria": {\n      "true": "description",\n      "false": "description"\n    }\n  }\n}';

interface Harness {
  state: EditorState;
  dispatch: (transaction: { state: EditorState }) => void;
}

function buildHarness(cursor: number): Harness {
  const harness: Harness = {
    state: EditorState.create({ doc: DOC, selection: { anchor: cursor }, extensions: [json()] }),
    dispatch: (transaction) => {
      harness.state = transaction.state;
    },
  };
  return harness;
}

function readSelectedText(harness: Harness): string {
  const { from, to } = harness.state.selection.main;
  return harness.state.sliceDoc(from, to);
}

function validateTabWalksForwardThroughEveryPlaceholderEvenWithoutASnippetSession() {
  const harness = buildHarness(DOC.indexOf('"type"'));
  const seen: string[] = [];
  while (selectNextPlaceholder(harness as never))
    seen.push(readSelectedText(harness));
  expect(seen).toEqual(['instruction', 'description', 'description']);
}

function validateShiftTabWalksBackFromTheLastPlaceholder() {
  const harness = buildHarness(DOC.length);
  const seen: string[] = [];
  while (selectPreviousPlaceholder(harness as never))
    seen.push(readSelectedText(harness));
  expect(seen).toEqual(['description', 'description', 'instruction', 'new_noul_1']);
}

function validateTabAtTheLastPlaceholderFallsThroughToIndent() {
  const harness = buildHarness(DOC.lastIndexOf('description'));
  harness.state = harness.state.update({ selection: { anchor: DOC.lastIndexOf('description'), head: DOC.lastIndexOf('description') + 11 } }).state;
  expect(selectNextPlaceholder(harness as never)).toBe(false);
}

function validateTabKeyBindingComesBeforeIndent() {
  const state = EditorState.create({ doc: DOC, extensions: [json(), createPlaceholderTab()] });
  const bindings = state.facet(keymap).flat().filter((binding) => binding.key === 'Tab');
  expect(bindings[0].run).toBe(selectNextPlaceholder);
  expect(bindings[0].shift).toBe(selectPreviousPlaceholder);
}

test('test_tab_walks_forward_through_every_placeholder_even_without_a_snippet_session', validateTabWalksForwardThroughEveryPlaceholderEvenWithoutASnippetSession);
test('test_shift_tab_walks_back_from_the_last_placeholder', validateShiftTabWalksBackFromTheLastPlaceholder);
test('test_tab_at_the_last_placeholder_falls_through_to_indent', validateTabAtTheLastPlaceholderFallsThroughToIndent);
test('test_tab_key_binding_comes_before_indent', validateTabKeyBindingComesBeforeIndent);
