import { test, expect } from 'bun:test';
import { acceptCompletion } from '@codemirror/autocomplete';
import { indentWithTab } from '@codemirror/commands';
import { basicSetup } from 'codemirror';
import { EditorState, Prec } from '@codemirror/state';
import { keymap, type EditorView } from '@codemirror/view';
import { createBacktickKeyNames } from './backtickCompletion';

function validateExtensionBuildsBeforeEditorsExist() {
    const extension = createBacktickKeyNames();
    const state = EditorState.create({ doc: '', extensions: [basicSetup, extension] });
    expect(state.doc.length).toBe(0);
}

function validateTabAcceptsTheCompletionBeforeIndentAndPlaceholderTab() {
    const placeholderTab = keymap.of([{ key: 'Tab', run: () => true }]);
    const extensions = [basicSetup, keymap.of([indentWithTab]), Prec.high(placeholderTab), createBacktickKeyNames()];
    const state = EditorState.create({ doc: '', extensions: extensions });
    const tabBindings = [];
    for (const bindingList of state.facet(keymap))
        for (const binding of bindingList)
            if (binding.key === 'Tab')
                tabBindings.push(binding);
    expect(tabBindings.length).toBeGreaterThan(2);
    expect(tabBindings[0].run).toBe(acceptCompletion);
    expect(acceptCompletion({ state } as EditorView)).toBe(false);
}

test('test_extension_builds_before_editors_exist', validateExtensionBuildsBeforeEditorsExist);
test('test_tab_accepts_the_completion_before_indent_and_placeholder_tab', validateTabAcceptsTheCompletionBeforeIndentAndPlaceholderTab);
