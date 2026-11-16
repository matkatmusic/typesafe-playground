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

interface ParsedEditorValues {
  stateValue: unknown;
  questionsValue: unknown;
}

function parseEditorStates(states: EditorState[]): ParsedEditorValues | null {
  const stateParse = computeJsonParseResult('State', states[0].doc.toString());
  if (!stateParse.isValid)
    return null;
  const questionsParse = computeJsonParseResult('Questions', states[1].doc.toString());
  if (!questionsParse.isValid)
    return null;
  return { stateValue: stateParse.value, questionsValue: questionsParse.value };
}

function findNameReferenceError(stateValue: unknown, batchItems: unknown[] | null, question: unknown, keyName: string): string | null {
  // // const isDefined = isNameDefined(states, keyName);
  // const isDefined = batchItems === null ? isNameDefined(states, keyName) : isNameDefinedInBatch(states[1], batchItems, keyName);
  // if (isDefined)
  //   continue;
  if (batchItems !== null)
    return findBatchReferenceError(batchItems, question, keyName);
  return findReferenceError(stateValue, question, keyName);
}

function buildMatchDiagnostic(view: EditorView, parsed: ParsedEditorValues, batchItems: unknown[] | null, match: RegExpMatchArray): Diagnostic | null {
  const keyName = match[1];
  const nameFrom = match.index + 1;
  const isInKey = syntaxTree(view.state).resolveInner(nameFrom, 1).name === 'PropertyName';
  if (isInKey)
    return null;
  const question = findEnclosingQuestion(view.state, parsed.questionsValue, nameFrom);
  const referenceError = findNameReferenceError(parsed.stateValue, batchItems, question, keyName);
  if (referenceError === null)
    return null;
  // message: `${keyName} is not defined in either JSON editor`,
  return { from: nameFrom, to: nameFrom + keyName.length, severity: 'error', message: referenceError };
}

function listMatchDiagnostics(view: EditorView, parsed: ParsedEditorValues, batchItems: unknown[] | null): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const match of view.state.doc.toString().matchAll(BACKTICKED_NAME)) {
    const diagnostic = buildMatchDiagnostic(view, parsed, batchItems, match);
    if (diagnostic !== null)
      diagnostics.push(diagnostic);
  }
  return diagnostics;
}

export function buildUndefinedNameSource(listStates: () => EditorState[]): LintSource {
  function findUndefinedNames(view: EditorView): Diagnostic[] {
    const states = listStates();
    const parsed = parseEditorStates(states);
    if (parsed === null)
      return [];
    return listMatchDiagnostics(view, parsed, listBatchItems(states));
  }
  return findUndefinedNames;
}
