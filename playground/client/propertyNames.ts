import { syntaxTree } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';
import type { SyntaxNode, Tree } from '@lezer/common';
import { listTopLevelProperties, readPropertyName } from './questionNames';

// export function readKeyName(text: string, nameNode: SyntaxNode): string {
//   const afterQuote = text.slice(nameNode.from + 1, nameNode.to);
//   const endsWithQuote = afterQuote.endsWith('"');
//   if (endsWithQuote)
//     return afterQuote.slice(0, -1);
//   return afterQuote;
// }

export function collectPropertyNames(tree: Tree, text: string): string[] {
  const names: string[] = [];
  const cursor = tree.cursor();
  do {
    if (cursor.name === 'PropertyName') {
      const name = readPropertyName(text, cursor.node);
      const isNew = !names.includes(name);
      const isNamed = name !== '';
      const shouldAdd = isNew && isNamed;
      if (shouldAdd)
        names.push(name);
    }
  } while (cursor.next());
  return names;
}

export function mergeNames(first: string[], second: string[]): string[] {
  const merged: string[] = [];
  for (let i = 0; i < first.length; i++)
    merged.push(first[i]);
  for (let i = 0; i < second.length; i++) {
    const isNew = !merged.includes(second[i]);
    if (isNew)
      merged.push(second[i]);
  }
  return merged;
}

export function listEditorNames(state: EditorState): string[] {
  return collectPropertyNames(syntaxTree(state), state.doc.toString());
}

export function collectAllObjects(tree: Tree): SyntaxNode[] {
  const objects: SyntaxNode[] = [];
  const cursor = tree.cursor();
  do {
    const isObject = cursor.name === 'Object';
    if (isObject)
      objects.push(cursor.node);
  } while (cursor.next());
  return objects;
}

export function collectNamedObjectValues(objects: SyntaxNode[], text: string, name: string): SyntaxNode[] {
  const values: SyntaxNode[] = [];
  for (const object of objects) {
    for (const property of listTopLevelProperties(object)) {
      const nameNode = property.getChild('PropertyName');
      const value = property.lastChild;
      const hasObjectValue = nameNode !== null && value !== null && value.name === 'Object';
      const isNamed = hasObjectValue && readPropertyName(text, nameNode) === name;
      if (isNamed)
        values.push(value);
    }
  }
  return values;
}

export function listChildNames(tree: Tree, text: string, path: string[]): string[] {
  let scopes = collectNamedObjectValues(collectAllObjects(tree), text, path[0]);
  for (let i = 1; i < path.length; i++)
    scopes = collectNamedObjectValues(scopes, text, path[i]);
  let names: string[] = [];
  for (const scope of scopes) {
    for (const property of listTopLevelProperties(scope)) {
      const nameNode = property.getChild('PropertyName');
      if (nameNode !== null)
        names = mergeNames(names, [readPropertyName(text, nameNode)]);
    }
  }
  return names;
}

export function findValueText(tree: Tree, text: string, path: string[]): string | null {
  let scopes = collectAllObjects(tree);
  for (let i = 0; i < path.length - 1; i++)
    scopes = collectNamedObjectValues(scopes, text, path[i]);
  for (const scope of scopes) {
    for (const property of listTopLevelProperties(scope)) {
      const nameNode = property.getChild('PropertyName');
      const value = property.lastChild;
      const isMatch = nameNode !== null && value !== null && readPropertyName(text, nameNode) === path[path.length - 1];
      if (isMatch)
        return text.slice(value.from, value.to);
    }
  }
  return null;
}

export function findEditorValueText(state: EditorState, path: string[]): string | null {
  return findValueText(syntaxTree(state), state.doc.toString(), path);
}

export function listEditorChildNames(state: EditorState, path: string[]): string[] {
  return listChildNames(syntaxTree(state), state.doc.toString(), path);
}
