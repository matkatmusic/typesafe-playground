import { syntaxTree } from '@codemirror/language';
import type { Diagnostic } from '@codemirror/lint';
import { Facet } from '@codemirror/state';
import type { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import type { SyntaxNode, Tree } from '@lezer/common';
import { listQuestionsErrors, listStateErrors } from '../typesafe-checks/typesafeChecks';
import { computeJsonParseResult } from './jsonParse';

export const IS_QUESTIONS_EDITOR = Facet.define<boolean, boolean>({ combine: (values) => values.includes(true) });

export function findTopLevelObject(tree: Tree): SyntaxNode | null {
  const first = tree.topNode.firstChild;
  if (first === null)
    return null;
  if (first.name !== 'Object')
    return null;
  return first;
}

export function readPropertyName(text: string, nameNode: SyntaxNode): string {
  const afterQuote = text.slice(nameNode.from + 1, nameNode.to);
  const endsWithQuote = afterQuote.endsWith('"');
  if (endsWithQuote)
    return afterQuote.slice(0, -1);
  return afterQuote;
}

export function listTopLevelProperties(rootNode: SyntaxNode): SyntaxNode[] {
  const properties: SyntaxNode[] = [];
  let child = rootNode.firstChild;
  while (child !== null) {
    if (child.name === 'Property')
      properties.push(child);
    child = child.nextSibling;
  }
  return properties;
}

export function findEnclosingQuestionProperty(state: EditorState, offset: number): SyntaxNode | null {
  const rootNode = findTopLevelObject(syntaxTree(state));
  if (rootNode === null)
    return null;
  for (const property of listTopLevelProperties(rootNode)) {
    if (offset >= property.from) {
      if (offset < property.to)
        return property;
    }
  }
  return null;
}

export function findEnclosingQuestionName(state: EditorState, offset: number): string | null {
  const property = findEnclosingQuestionProperty(state, offset);
  if (property === null)
    return null;
  const nameNode = property.getChild('PropertyName');
  if (nameNode === null)
    return null;
  return readPropertyName(state.doc.toString(), nameNode);
}

// ponytail: first key that prefixes the error wins; keys "a" and "a.b" would both match "a.b ...".
export function findQuestionKeyNode(state: EditorState, error: string): SyntaxNode | null {
  const rootNode = findTopLevelObject(syntaxTree(state));
  if (rootNode === null)
    return null;
  const text = state.doc.toString();
  for (const property of listTopLevelProperties(rootNode)) {
    const nameNode = property.getChild('PropertyName');
    if (nameNode === null)
      continue;
    const questionName = readPropertyName(text, nameNode);
    for (const boundary of [' ', '.']) {
      if (error.startsWith(questionName + boundary))
        return nameNode;
    }
  }
  return null;
}

export function findQuestionsShapeErrors(view: EditorView): Diagnostic[] {
  const questionsParse = computeJsonParseResult('Questions', view.state.doc.toString());
  if (!questionsParse.isValid)
    return [];
  const diagnostics: Diagnostic[] = [];
  for (const error of listQuestionsErrors(questionsParse.value)) {
    const keyNode = findQuestionKeyNode(view.state, error);
    if (keyNode === null) {
      diagnostics.push({ from: 0, to: 1, severity: 'error', message: error });
      continue;
    }
    diagnostics.push({ from: keyNode.from, to: keyNode.to, severity: 'error', message: error });
  }
  return diagnostics;
}

export function findStateShapeErrors(view: EditorView): Diagnostic[] {
  const stateParse = computeJsonParseResult('State', view.state.doc.toString());
  if (!stateParse.isValid)
    return [];
  const diagnostics: Diagnostic[] = [];
  for (const error of listStateErrors(stateParse.value))
    diagnostics.push({ from: 0, to: 1, severity: 'error', message: error });
  return diagnostics;
}

export function listTopLevelKeys(rootNode: SyntaxNode, text: string): string[] {
  const keys: string[] = [];
  const properties = listTopLevelProperties(rootNode);
  for (let i = 0; i < properties.length; i++) {
    const nameNode = properties[i].firstChild;
    if (nameNode === null)
      throw new Error('property has no name node');
    keys.push(readPropertyName(text, nameNode));
  }
  return keys;
}
