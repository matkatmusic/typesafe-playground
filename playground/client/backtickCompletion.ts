import { acceptCompletion, autocompletion } from '@codemirror/autocomplete';
import type { Completion, CompletionContext, CompletionResult, CompletionSource } from '@codemirror/autocomplete';
import { Prec } from '@codemirror/state';
import type { EditorState, Extension } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { getQuestionsEditor, getStateEditor } from './editors';
import { listEditorChildNames, listEditorNames, mergeNames } from './propertyNames';

const NAME_TYPING = /^[^`\s]*$/;
const KEY_PATH_TYPING = /`([^`\s.]+(?:\.[^`\s.]+)*)\.$/;

export function buildNameOptions(names: string[]): Completion[] {
  const options: Completion[] = [];
  for (let i = 0; i < names.length; i++)
    options.push({ label: names[i], apply: names[i] + '`' });
  return options;
}

export function listBothEditorStates(): EditorState[] {
  return [getStateEditor().state, getQuestionsEditor().state];
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

export function createBacktickKeyNames(): Extension {
  return [
    autocompletion({ override: [buildBacktickSource(listBothEditorStates)] }),
    Prec.highest(keymap.of([{ key: 'Tab', run: acceptCompletion }])),
  ];
}
