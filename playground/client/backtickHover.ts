// Replaced by client/backtickTooltip.ts
// import { hoverTooltip } from '@codemirror/view';
// import type { EditorView, Tooltip } from '@codemirror/view';
// import type { EditorState, Extension } from '@codemirror/state';
// import { listBothEditorStates } from './backtickCompletion';
// import { findEditorValueText, splitKeyPath } from './propertyNames';
//
// const BACKTICKED_NAME = /`([^`\s]+)`/g;
//
// export function buildBacktickHoverSource(listStates: () => EditorState[]): (view: EditorView, pos: number) => Tooltip | null {
//   function findBacktickValueTooltip(view: EditorView, pos: number): Tooltip | null {
//     const line = view.state.doc.lineAt(pos);
//     for (const match of line.text.matchAll(BACKTICKED_NAME)) {
//       const name = match[1];
//       const from = line.from + match.index + 1;
//       const to = from + name.length;
//       const isOverName = pos >= from && pos <= to;
//       if (!isOverName)
//         continue;
//       const states = listStates();
//       for (let i = 0; i < states.length; i++) {
//         const valueText = findEditorValueText(states[i], splitKeyPath(name));
//         if (valueText !== null)
//           return { pos: from, end: to, above: true, create: () => ({ dom: createValueElement(valueText) }) };
//       }
//       return null;
//     }
//     return null;
//   }
//   return findBacktickValueTooltip;
// }
//
// function createValueElement(valueText: string): HTMLElement {
//   const dom = document.createElement('pre');
//   dom.className = 'cm-backtick-value';
//   dom.textContent = valueText;
//   return dom;
// }
//
// export function createBacktickHover(): Extension {
//   return hoverTooltip(buildBacktickHoverSource(listBothEditorStates));
// }
export {};
