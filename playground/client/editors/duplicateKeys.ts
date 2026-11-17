import { syntaxTree } from '@codemirror/language';
import type { Diagnostic } from '@codemirror/lint';
import type { EditorView } from '@codemirror/view';
import type { SyntaxNode } from '@lezer/common';
import { collectAllObjects } from '../questions/propertyNames';
import { listTopLevelProperties, readPropertyName } from '../questions/questionNames';

function collectNameNodes(object: SyntaxNode): SyntaxNode[] {
  const nameNodes: SyntaxNode[] = [];
  for (const property of listTopLevelProperties(object)) {
    const nameNode = property.getChild('PropertyName');
    if (nameNode === null)
      continue;
    nameNodes.push(nameNode);
  }
  return nameNodes;
}

function countKeys(text: string, nameNodes: SyntaxNode[]): Map<string, number> {
  const keyCounts = new Map<string, number>();
  for (const nameNode of nameNodes) {
    const key = readPropertyName(text, nameNode);
    keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
  }
  return keyCounts;
}

function createDuplicateDiagnostics(text: string, nameNodes: SyntaxNode[], keyCounts: Map<string, number>): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const nameNode of nameNodes) {
    const key = readPropertyName(text, nameNode);
    const isDuplicate = (keyCounts.get(key) ?? 0) > 1;
    if (isDuplicate)
      diagnostics.push({ from: nameNode.from, to: nameNode.to, severity: 'error', message: `"${key}" appears more than once in this object` });
  }
  return diagnostics;
}

export function findDuplicateKeys(view: EditorView): Diagnostic[] {
  const text = view.state.doc.toString();
  const diagnostics: Diagnostic[] = [];
  for (const object of collectAllObjects(syntaxTree(view.state))) {
    const nameNodes = collectNameNodes(object);
    const keyCounts = countKeys(text, nameNodes);
    diagnostics.push(...createDuplicateDiagnostics(text, nameNodes, keyCounts));
  }
  return diagnostics;
}
