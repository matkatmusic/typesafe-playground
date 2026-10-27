import { autocompletion } from '@codemirror/autocomplete';
import type { Completion, CompletionContext, CompletionResult, CompletionSource } from '@codemirror/autocomplete';
import type { EditorState, Extension } from '@codemirror/state';
import { getQuestionsEditor, getStateEditor } from './editors';
import { listEditorNames, mergeNames } from './propertyNames';

const NAME_TYPING = /^[^`\s]*$/;

export function buildNameOptions(names: string[]): Completion[] {
  const options: Completion[] = [];
  for (let i = 0; i < names.length; i++)
    options.push({ label: names[i], apply: names[i] + '`' });
  return options;
}

export function listBothEditorStates(): EditorState[] {
  return [getStateEditor().state, getQuestionsEditor().state];
}

export function buildBacktickSource(listStates: () => EditorState[]): CompletionSource {
  function findBacktickNames(context: CompletionContext): CompletionResult | null {
    if (context.state.readOnly)
      return null;
    const lastTyped = context.state.sliceDoc(Math.max(0, context.pos - 1), context.pos);
    if (lastTyped !== '`')
      return null;
    const states = listStates();
    let names: string[] = [];
    for (let i = 0; i < states.length; i++)
      names = mergeNames(names, listEditorNames(states[i]));
    return { from: context.pos, options: buildNameOptions(names), validFor: NAME_TYPING };
  }
  return findBacktickNames;
}

export function createBacktickKeyNames(): Extension {
  return autocompletion({ override: [buildBacktickSource(listBothEditorStates)] });
}
