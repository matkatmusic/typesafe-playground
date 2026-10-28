import { acceptCompletion, autocompletion } from '@codemirror/autocomplete';
import type { Completion, CompletionContext, CompletionResult, CompletionSource } from '@codemirror/autocomplete';
import { linter } from '@codemirror/lint';
import type { Diagnostic, LintSource } from '@codemirror/lint';
import { Prec, StateEffect } from '@codemirror/state';
import type { EditorState, Extension } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import type { ViewUpdate } from '@codemirror/view';
import { getQuestionsEditor, getStateEditor } from './editors';
import { listEditorChildNames, listEditorNames, mergeNames } from './propertyNames';

const NAME_TYPING = /^[^`\s]*$/;
const KEY_PATH_TYPING = /`([^`\s.]+(?:\.[^`\s.]+)*)\.$/;
const BACKTICKED_NAME = /`([^`\s]+)`/g;
const OTHER_EDITOR_CHANGED = StateEffect.define<null>();

export function buildNameOptions(names: string[]): Completion[] {
  const options: Completion[] = [];
  for (let i = 0; i < names.length; i++)
    options.push({ label: names[i], apply: names[i] + '`' });
  return options;
}

export function listBothEditorStates(): EditorState[] {
  return [getStateEditor().state, getQuestionsEditor().state];
}

export function listBothEditorViews(): EditorView[] {
  return [getStateEditor(), getQuestionsEditor()];
}

export function buildOtherEditorRelint(listViews: () => EditorView[]): (update: ViewUpdate) => void {
  function dispatchToOtherEditors(update: ViewUpdate): void {
    const isDocUnchanged = !update.docChanged;
    if (isDocUnchanged)
      return;
    const views = listViews();
    for (let i = 0; i < views.length; i++) {
      const isOtherEditor = views[i] !== update.view;
      if (isOtherEditor)
        views[i].dispatch({ effects: OTHER_EDITOR_CHANGED.of(null) });
    }
  }
  return dispatchToOtherEditors;
}

export function isOtherEditorChanged(update: ViewUpdate): boolean {
  for (let i = 0; i < update.transactions.length; i++) {
    const effects = update.transactions[i].effects;
    for (let j = 0; j < effects.length; j++) {
      const isRelintEffect = effects[j].is(OTHER_EDITOR_CHANGED);
      if (isRelintEffect)
        return true;
    }
  }
  return false;
}

export function readKeyPath(context: CompletionContext): string[] | null {
  const line = context.state.doc.lineAt(context.pos);
  const typedBefore = line.text.slice(0, context.pos - line.from);
  const match = KEY_PATH_TYPING.exec(typedBefore);
  if (match === null)
    return null;
  return match[1].split('.');
}

export function buildBacktickSource(listStates: () => EditorState[]): CompletionSource {
  function findBacktickNames(context: CompletionContext): CompletionResult | null {
    if (context.state.readOnly)
      return null;
    const lastTyped = context.state.sliceDoc(Math.max(0, context.pos - 1), context.pos);
    const states = listStates();
    let names: string[] = [];
    if (lastTyped === '`') {
      for (let i = 0; i < states.length; i++)
        names = mergeNames(names, listEditorNames(states[i]));
      return { from: context.pos, options: buildNameOptions(names), validFor: NAME_TYPING };
    }
    const keyPath = readKeyPath(context);
    if (keyPath === null)
      return null;
    for (let i = 0; i < states.length; i++)
      names = mergeNames(names, listEditorChildNames(states[i], keyPath));
    if (names.length === 0)
      return null;
    return { from: context.pos, options: buildNameOptions(names), validFor: NAME_TYPING };
  }
  return findBacktickNames;
}

export function isNameDefined(states: EditorState[], keyName: string): boolean {
  const path = keyName.split('.');
  const lastSegment = path[path.length - 1];
  for (let i = 0; i < states.length; i++) {
    const siblingNames = path.length === 1 ? listEditorNames(states[i]) : listEditorChildNames(states[i], path.slice(0, -1));
    const hasLastSegment = siblingNames.includes(lastSegment);
    if (hasLastSegment)
      return true;
  }
  return false;
}

export function buildUndefinedNameSource(listStates: () => EditorState[]): LintSource {
  function findUndefinedNames(view: EditorView): Diagnostic[] {
    const states = listStates();
    const diagnostics: Diagnostic[] = [];
    for (const match of view.state.doc.toString().matchAll(BACKTICKED_NAME)) {
      const keyName = match[1];
      const isDefined = isNameDefined(states, keyName);
      if (isDefined)
        continue;
      diagnostics.push({
        from: match.index + 1,
        to: match.index + 1 + keyName.length,
        severity: 'error',
        message: `${keyName} is not defined in either JSON editor`,
      });
    }
    return diagnostics;
  }
  return findUndefinedNames;
}

export function createBacktickKeyNames(): Extension {
  return [
    autocompletion({ override: [buildBacktickSource(listBothEditorStates)] }),
    // // ponytail: rechecked only on this editor's own edits.
    linter(buildUndefinedNameSource(listBothEditorStates), { needsRefresh: isOtherEditorChanged }),
    EditorView.updateListener.of(buildOtherEditorRelint(listBothEditorViews)),
    Prec.highest(keymap.of([{ key: 'Tab', run: acceptCompletion }])),
  ];
}
