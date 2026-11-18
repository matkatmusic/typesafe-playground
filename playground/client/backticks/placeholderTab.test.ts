import { test, expect } from 'bun:test';
import { json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import type { KeyBinding } from '@codemirror/view';
import { getAddPlaceholderRangesEffect, findInsertedRanges, getPlaceholderRangesField } from './placeholderRanges';
import { createPlaceholderTab, selectNextPlaceholder, selectPreviousPlaceholder } from './placeholderTab';

function getDoc(): string {
    return '{\n  "new_noul_1": {\n    "type": "noul",\n    "instructions": "instruction",\n    "criteria": {\n      "true": "description",\n      "false": "description"\n    }\n  }\n}';
}

function getPlaceholderRanges() {
    return findInsertedRanges(getDoc(), ['new_noul_1', 'instruction', 'description', 'description'], 0);
}

interface Harness {
    state: EditorState;
    dispatch: (transaction: { state: EditorState }) => void;
}

function buildHarness(cursor: number): Harness {
    const harness: Harness = {
        state: EditorState.create({ doc: getDoc(), selection: { anchor: cursor }, extensions: [json(), getPlaceholderRangesField()] }).update({ effects: getAddPlaceholderRangesEffect().of(getPlaceholderRanges()) }).state,
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
    const harness = buildHarness(getDoc().indexOf('"type"'));
    const seen: string[] = [];
    while (selectNextPlaceholder(harness as never))
        seen.push(readSelectedText(harness));
    expect(seen).toEqual(['instruction', 'description', 'description']);
}

function validateShiftTabWalksBackFromTheLastPlaceholder() {
    const harness = buildHarness(getDoc().length);
    const seen: string[] = [];
    while (selectPreviousPlaceholder(harness as never))
        seen.push(readSelectedText(harness));
    expect(seen).toEqual(['description', 'description', 'instruction', 'new_noul_1']);
}

function validateTabAndShiftTabSkipEditedPlaceholders() {
    const harness = buildHarness(0);
    const nameStart = getDoc().indexOf('new_noul_1');
    const instructionStart = getDoc().indexOf('instruction"');
    const changes = [{ from: nameStart, to: nameStart + 10, insert: 'new_noul_5' }, { from: instructionStart + 3, insert: 'X' }];
    harness.state = harness.state.update({ changes: changes }).state;
    const forward: string[] = [];
    while (selectNextPlaceholder(harness as never))
        forward.push(readSelectedText(harness));
    expect(forward).toEqual(['description', 'description']);
    const backward: string[] = [];
    while (selectPreviousPlaceholder(harness as never))
        backward.push(readSelectedText(harness));
    expect(backward).toEqual(['description']);
}

function validateTabAtTheLastPlaceholderFallsThroughToIndent() {
    const harness = buildHarness(getDoc().lastIndexOf('description'));
    harness.state = harness.state.update({ selection: { anchor: getDoc().lastIndexOf('description'), head: getDoc().lastIndexOf('description') + 11 } }).state;
    expect(selectNextPlaceholder(harness as never)).toBe(false);
}

function validateTabKeyBindingComesBeforeIndent() {
    const state = EditorState.create({ doc: getDoc(), extensions: [json(), createPlaceholderTab()] });
    const bindingGroups = state.facet(keymap);
    const tabBindings: KeyBinding[] = [];
    for (const bindingGroup of bindingGroups) {
        for (const binding of bindingGroup) {
            const isTabBinding = binding.key === 'Tab';
            if (isTabBinding)
                tabBindings.push(binding);
        }
    }
    expect(tabBindings[0].run).toBe(selectNextPlaceholder);
    expect(tabBindings[0].shift).toBe(selectPreviousPlaceholder);
}

test('test_tab_walks_forward_through_every_placeholder_even_without_a_snippet_session', validateTabWalksForwardThroughEveryPlaceholderEvenWithoutASnippetSession);
test('test_shift_tab_walks_back_from_the_last_placeholder', validateShiftTabWalksBackFromTheLastPlaceholder);
test('test_tab_and_shift_tab_skip_edited_placeholders', validateTabAndShiftTabSkipEditedPlaceholders);
test('test_tab_at_the_last_placeholder_falls_through_to_indent', validateTabAtTheLastPlaceholderFallsThroughToIndent);
test('test_tab_key_binding_comes_before_indent', validateTabKeyBindingComesBeforeIndent);
