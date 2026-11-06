import { acceptCompletion, autocompletion } from '@codemirror/autocomplete';
import type { Completion, CompletionContext, CompletionResult, CompletionSource } from '@codemirror/autocomplete';
import { linter } from '@codemirror/lint';
import type { Diagnostic, LintSource } from '@codemirror/lint';
import { Prec, StateEffect } from '@codemirror/state';
import type { EditorState, Extension } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import type { ViewUpdate } from '@codemirror/view';
import { jsonLanguage } from '@codemirror/lang-json';
import { syntaxTree } from '@codemirror/language';
import { findReferenceError } from '../typesafe-checks/typesafeChecks';
import { getQuestionsEditor, getStateEditor } from './editors';
import { computeJsonParseResult } from './jsonParse';
// import { findEditorValueText, listEditorChildNames, listEditorNames, mergeNames, splitKeyPath } from './propertyNames';
// import { findPathValue } from './references';
// import { collectPropertyNames, listChildNames, listEditorChildNames, listEditorNames, mergeNames } from './propertyNames';
import { collectPropertyNames, listChildNames, listEditorChildNames, mergeNames } from './propertyNames';
// import { findEnclosingQuestionName, findEnclosingQuestionProperty, IS_QUESTIONS_EDITOR } from './questionNames';
import { findEnclosingQuestionName, findEnclosingQuestionProperty, findTopLevelObject, IS_QUESTIONS_EDITOR, listTopLevelKeys } from './questionNames';
import { pageState } from './state';

const NAME_TYPING = /^[^`\s]*$/;
const KEY_PATH_TYPING = /`([^`\s.]+(?:\.[^`\s.]+)*)\.$/;
// const BACKTICKED_NAME = /`([^`\s]+)`/g;
const BACKTICKED_NAME = /(?<!\\)`([^`\s]+)`/g;
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

export function buildBacktickSource(listStates: () => EditorState[]): CompletionSource {
  function findBacktickNames(context: CompletionContext): CompletionResult | null {
    if (context.state.readOnly)
      return null;
    const lastTyped = context.state.sliceDoc(Math.max(0, context.pos - 1), context.pos);
    const states = listStates();
    const questionText = findEnclosingQuestionText(context.state, context.pos);
    let names: string[] = [];
    if (lastTyped === '`') {
      // for (let i = 0; i < states.length; i++)
      //   names = mergeNames(names, listEditorNames(states[i]));
      // names = listEditorNames(states[0]);
      const stateRoot = findTopLevelObject(syntaxTree(states[0]));
      if (stateRoot !== null)
        names = listTopLevelKeys(stateRoot, states[0].doc.toString());
      const batchItems = listBatchItems(states);
      if (batchItems !== null) {
        names = [];
        for (const key of Object.keys(batchItems[0] as object)) {
          let isInEveryItem = true;
          for (const item of batchItems) {
            if (!Object.hasOwn(item as object, key))
              isInEveryItem = false;
          }
          if (isInEveryItem)
            names.push(key);
        }
      }
      if (questionText !== null)
        names = mergeNames(names, collectPropertyNames(jsonLanguage.parser.parse(questionText), questionText));
      return { from: context.pos, options: buildNameOptions(names), validFor: NAME_TYPING };
    }
    const keyPath = readKeyPath(context);
    if (keyPath === null)
      return null;
    // for (let i = 0; i < states.length; i++)
    //   names = mergeNames(names, listEditorChildNames(states[i], keyPath));
    names = listEditorChildNames(states[0], keyPath);
    if (questionText !== null)
      names = mergeNames(names, listChildNames(jsonLanguage.parser.parse(questionText), questionText, keyPath));
    if (names.length === 0)
      return null;
    return { from: context.pos, options: buildNameOptions(names), validFor: NAME_TYPING };
  }
  return findBacktickNames;
}

// export function isNameDefined(states: EditorState[], keyName: string): boolean {
//   const path = keyName.split('.');
//   const lastSegment = path[path.length - 1];
//   for (let i = 0; i < states.length; i++) {
//     const siblingNames = path.length === 1 ? listEditorNames(states[i]) : listEditorChildNames(states[i], path.slice(0, -1));
//     const hasLastSegment = siblingNames.includes(lastSegment);
//     if (hasLastSegment)
//       return true;
//   }
//   return false;
// }

// export function isNameDefined(states: EditorState[], keyName: string): boolean {
//   const path = splitKeyPath(keyName);
//   for (let i = 0; i < states.length; i++) {
//     const hasValue = findEditorValueText(states[i], path) !== null;
//     if (hasValue)
//       return true;
//   }
//   return false;
// }

export function listBatchItems(states: EditorState[]): unknown[] | null {
  if (!pageState.isBatchOn)
    return null;
  const stateParse = computeJsonParseResult('state', states[0].doc.toString());
  if (!stateParse.isValid)
    return null;
  const items = stateParse.value;
  if (!Array.isArray(items))
    return null;
  if (items.length === 0)
    return null;
  return items;
}

// export function isNameDefinedInBatch(questionsState: EditorState, items: unknown[], keyName: string): boolean {
//   const isDefinedByQuestions = isNameDefined([questionsState], keyName);
//   if (isDefinedByQuestions)
//     return true;
//   for (const item of items) {
//     const isInItem = findPathValue(item, keyName).isFound;
//     if (!isInItem)
//       return false;
//   }
//   return true;
// }

export function findEnclosingQuestion(state: EditorState, parsedQuestions: unknown, offset: number): unknown {
  const isQuestionsEditor = state.facet(IS_QUESTIONS_EDITOR);
  if (!isQuestionsEditor)
    return undefined;
  const questionName = findEnclosingQuestionName(state, offset);
  if (questionName === null)
    return undefined;
  return (parsedQuestions as Record<string, unknown>)[questionName];
}

export function findBatchReferenceError(items: unknown[], question: unknown, name: string): string | null {
  for (const item of items) {
    const referenceError = findReferenceError(item, question, name);
    if (referenceError !== null)
      return referenceError;
  }
  return null;
}

export function relintBothEditors(): void {
  for (const view of listBothEditorViews())
    view.dispatch({ effects: OTHER_EDITOR_CHANGED.of(null) });
}

export function buildUndefinedNameSource(listStates: () => EditorState[]): LintSource {
  function findUndefinedNames(view: EditorView): Diagnostic[] {
    const states = listStates();
    const stateParse = computeJsonParseResult('State', states[0].doc.toString());
    if (!stateParse.isValid)
      return [];
    const questionsParse = computeJsonParseResult('Questions', states[1].doc.toString());
    if (!questionsParse.isValid)
      return [];
    const batchItems = listBatchItems(states);
    const tree = syntaxTree(view.state);
    const diagnostics: Diagnostic[] = [];
    for (const match of view.state.doc.toString().matchAll(BACKTICKED_NAME)) {
      const keyName = match[1];
      const nameFrom = match.index + 1;
      // // const isDefined = isNameDefined(states, keyName);
      // const isDefined = batchItems === null ? isNameDefined(states, keyName) : isNameDefinedInBatch(states[1], batchItems, keyName);
      // if (isDefined)
      //   continue;
      const isInKey = tree.resolveInner(nameFrom, 1).name === 'PropertyName';
      if (isInKey)
        continue;
      const question = findEnclosingQuestion(view.state, questionsParse.value, nameFrom);
      let referenceError = findReferenceError(stateParse.value, question, keyName);
      if (batchItems !== null)
        referenceError = findBatchReferenceError(batchItems, question, keyName);
      if (referenceError === null)
        continue;
      diagnostics.push({
        from: nameFrom,
        to: nameFrom + keyName.length,
        severity: 'error',
        // message: `${keyName} is not defined in either JSON editor`,
        message: referenceError,
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
