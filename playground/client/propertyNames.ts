import { syntaxTree } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';
import type { Tree } from '@lezer/common';
import { readPropertyName } from './questionNames';

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
