import { syntaxTree } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';
import type { SyntaxNode, Tree } from '@lezer/common';
import { listTopLevelProperties, readPropertyName } from './questionNames';
import { collectAllObjects } from './propertyNames';

// const KEY_PATH_STEP = /\[\d+\]|[^.[\]]+/g;
const INDEX_STEP = /^\[(\d+)\]$/;
// export function splitKeyPath(keyName: string): string[] {
//   const steps = keyName.match(KEY_PATH_STEP);
//   return steps === null ? [] : steps;
// }

export function collectStepValues(scopes: SyntaxNode[], text: string, step: string): SyntaxNode[] {
  const values: SyntaxNode[] = [];
  const indexMatch = INDEX_STEP.exec(step);
  for (const scope of scopes) {
    if (indexMatch !== null) {
      const elements: SyntaxNode[] = [];
      for (let child = scope.firstChild; child !== null; child = child.nextSibling) {
        const isPunctuation = child.name === '[' || child.name === ',' || child.name === ']';
        if (!isPunctuation)
          elements.push(child);
      }
      const index = Number(indexMatch[1]);
      values.push(...(scope.name === 'Array' ? elements.slice(index, index + 1) : []));
      continue;
    }
    for (const property of listTopLevelProperties(scope)) {
      const nameNode = property.getChild('PropertyName');
      const value = property.lastChild;
      const isMatch = nameNode !== null && value !== null && readPropertyName(text, nameNode) === step;
      if (isMatch)
        values.push(value);
    }
  }
  return values;
}

// export function findValueText(tree: Tree, text: string, path: string[]): string | null {
//   let scopes = collectAllObjects(tree);
//   for (let i = 0; i < path.length - 1; i++)
//     scopes = collectNamedObjectValues(scopes, text, path[i]);
//   for (const scope of scopes) {
//     for (const property of listTopLevelProperties(scope)) {
//       const nameNode = property.getChild('PropertyName');
//       const value = property.lastChild;
//       const isMatch = nameNode !== null && value !== null && readPropertyName(text, nameNode) === path[path.length - 1];
//       if (isMatch)
//         return text.slice(value.from, value.to);
//     }
//   }
//   return null;
// }
export function findValueText(tree: Tree, text: string, path: string[]): string | null {
  if (path.length === 0)
    return null;
  let scopes = collectAllObjects(tree);
  for (const step of path)
    scopes = collectStepValues(scopes, text, step);
  return scopes.length === 0 ? null : text.slice(scopes[0].from, scopes[0].to);
}

export function findEditorValueText(state: EditorState, path: string[]): string | null {
  return findValueText(syntaxTree(state), state.doc.toString(), path);
}
