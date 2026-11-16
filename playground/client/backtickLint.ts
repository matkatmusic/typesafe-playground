import { syntaxTree } from '@codemirror/language';
import type { Diagnostic, LintSource } from '@codemirror/lint';
import type { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { findReferenceError } from '../typesafe-checks/typesafeChecks';
import { listBatchItems } from './backtickBatchItems';
import { computeJsonParseResult } from './jsonParse';
import { findEnclosingQuestionName, IS_QUESTIONS_EDITOR } from './questionNames';

// const BACKTICKED_NAME = /`([^`\s]+)`/g;
const BACKTICKED_NAME = /(?<!\\)`([^`\s]+)`/g;

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
