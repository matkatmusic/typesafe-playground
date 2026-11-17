import type { Completion, CompletionContext, CompletionResult, CompletionSource } from '@codemirror/autocomplete';
import { jsonLanguage } from '@codemirror/lang-json';
import { syntaxTree } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';
import { listBatchItems } from './backtickBatchItems';
// import { findEditorValueText, listEditorChildNames, listEditorNames, mergeNames, splitKeyPath } from './propertyNames';
// import { findPathValue } from './references';
// import { collectPropertyNames, listChildNames, listEditorChildNames, listEditorNames, mergeNames } from './propertyNames';
import { collectPropertyNames, listChildNames, listEditorChildNames, mergeNames } from './propertyNames';
import { findEnclosingQuestionProperty, findTopLevelObject, IS_QUESTIONS_EDITOR, listTopLevelKeys } from './questionNames';

const NAME_TYPING = /^[^`\s]*$/;
// const KEY_PATH_TYPING = /`([^`\s.]+(?:\.[^`\s.]+)*)\.$/;
const KEY_PATH_TYPING = /(?<!\\)`([^`\s.]+(?:\.[^`\s.]+)*)\.$/;

export function buildNameOptions(names: string[]): Completion[] {
  const options: Completion[] = [];
  for (let i = 0; i < names.length; i++)
    options.push({ label: names[i], apply: names[i] + '`' });
  return options;
}

export function readKeyPath(context: CompletionContext): string[] | null {
  const line = context.state.doc.lineAt(context.pos);
  const typedBefore = line.text.slice(0, context.pos - line.from);
  const match = KEY_PATH_TYPING.exec(typedBefore);
  if (match === null)
    return null;
  return match[1].split('.');
}

export function findEnclosingQuestionText(state: EditorState, offset: number): string | null {
  const isQuestionsEditor = state.facet(IS_QUESTIONS_EDITOR);
  if (!isQuestionsEditor)
    return null;
  const property = findEnclosingQuestionProperty(state, offset);
  if (property === null)
    return null;
  const valueNode = property.lastChild;
  if (valueNode === null)
    return null;
  return state.sliceDoc(valueNode.from, valueNode.to);
}

function listKeysInEveryBatchItem(batchItems: unknown[]): string[] {
  const names: string[] = [];
  for (const key of Object.keys(batchItems[0] as object)) {
    let isInEveryItem = true;
    for (const item of batchItems) {
      const itemHasKey = Object.hasOwn(item as object, key);
      if (!itemHasKey)
        isInEveryItem = false;
    }
    if (isInEveryItem)
      names.push(key);
  }
  return names;
}

function listNamesAfterBacktick(states: EditorState[], questionText: string | null): string[] {
  let names: string[] = [];
  // for (let i = 0; i < states.length; i++)
  //   names = mergeNames(names, listEditorNames(states[i]));
  // names = listEditorNames(states[0]);
  const stateRoot = findTopLevelObject(syntaxTree(states[0]));
  if (stateRoot !== null)
    names = listTopLevelKeys(stateRoot, states[0].doc.toString());
  const batchItems = listBatchItems(states);
  if (batchItems !== null)
    names = listKeysInEveryBatchItem(batchItems);
  if (questionText !== null)
    names = mergeNames(names, collectPropertyNames(jsonLanguage.parser.parse(questionText), questionText));
  return names;
}

function findKeyPathResult(context: CompletionContext, states: EditorState[], questionText: string | null): CompletionResult | null {
  const keyPath = readKeyPath(context);
  if (keyPath === null)
    return null;
  // for (let i = 0; i < states.length; i++)
  //   names = mergeNames(names, listEditorChildNames(states[i], keyPath));
  let names = listEditorChildNames(states[0], keyPath);
  if (questionText !== null)
    names = mergeNames(names, listChildNames(jsonLanguage.parser.parse(questionText), questionText, keyPath));
  if (names.length === 0)
    return null;
  return { from: context.pos, options: buildNameOptions(names), validFor: NAME_TYPING };
}

function findBacktickNames(listStates: () => EditorState[], context: CompletionContext): CompletionResult | null {
  if (context.state.readOnly)
    return null;
  const lastTyped = context.state.sliceDoc(Math.max(0, context.pos - 1), context.pos);
  const states = listStates();
  const questionText = findEnclosingQuestionText(context.state, context.pos);
  if (lastTyped === '`') {
    const names = listNamesAfterBacktick(states, questionText);
    return { from: context.pos, options: buildNameOptions(names), validFor: NAME_TYPING };
  }
  return findKeyPathResult(context, states, questionText);
}

export function buildBacktickSource(listStates: () => EditorState[]): CompletionSource {
  return (context: CompletionContext) => findBacktickNames(listStates, context);
}
