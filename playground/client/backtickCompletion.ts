import { acceptCompletion, autocompletion } from '@codemirror/autocomplete';
import { linter } from '@codemirror/lint';
import { Prec } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { buildOtherEditorRelint, isOtherEditorChanged, listBothEditorStates, listBothEditorViews } from './backtickEditors';
import { buildUndefinedNameSource } from './backtickLint';
import { buildBacktickSource } from './backtickSource';

export function createBacktickKeyNames(): Extension {
  return [
    autocompletion({ override: [buildBacktickSource(listBothEditorStates)] }),
    // // ponytail: rechecked only on this editor's own edits.
    linter(buildUndefinedNameSource(listBothEditorStates), { needsRefresh: isOtherEditorChanged }),
    EditorView.updateListener.of(buildOtherEditorRelint(listBothEditorViews)),
    Prec.highest(keymap.of([{ key: 'Tab', run: acceptCompletion }])),
  ];
}
