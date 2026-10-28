import { syntaxTree } from '@codemirror/language';
import type { Diagnostic } from '@codemirror/lint';
import type { EditorView } from '@codemirror/view';
import { collectAllObjects } from './propertyNames';
import { listTopLevelProperties, readPropertyName } from './questionNames';

export function findDuplicateKeys(view: EditorView): Diagnostic[] {
  const text = view.state.doc.toString();
  const diagnostics: Diagnostic[] = [];
  for (const object of collectAllObjects(syntaxTree(view.state))) {
    const nameNodes = [];
    const keyCounts = new Map<string, number>();
    for (const property of listTopLevelProperties(object)) {
      const nameNode = property.getChild('PropertyName');
      if (nameNode === null)
        continue;
      const key = readPropertyName(text, nameNode);
      nameNodes.push(nameNode);
      keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
    }
    for (const nameNode of nameNodes) {
      const key = readPropertyName(text, nameNode);
      const isDuplicate = (keyCounts.get(key) ?? 0) > 1;
      if (isDuplicate)
        diagnostics.push({ from: nameNode.from, to: nameNode.to, severity: 'error', message: `"${key}" appears more than once in this object` });
    }
  }
  return diagnostics;
}
