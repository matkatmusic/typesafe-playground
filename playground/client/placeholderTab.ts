import { EditorSelection, Prec } from '@codemirror/state';
import type { EditorState, Extension, Transaction } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { findPlaceholderRanges } from './placeholders';
import type { PlaceholderRange } from './placeholders';

interface PlaceholderTarget {
  state: EditorState;
  dispatch: (transaction: Transaction) => void;
}

function selectPlaceholderText(target: PlaceholderTarget, range: PlaceholderRange): void {
  const selection = EditorSelection.single(range.from + 1, range.to - 1);
  target.dispatch(target.state.update({ selection: selection, scrollIntoView: true }));
}

export function selectNextPlaceholder(target: PlaceholderTarget): boolean {
  const ranges = findPlaceholderRanges(target.state.doc.toString());
  const cursorEnd = target.state.selection.main.to;
  for (let i = 0; i < ranges.length; i++) {
    const isAfterCursor = ranges[i].from + 1 > cursorEnd;
    if (!isAfterCursor)
      continue;
    selectPlaceholderText(target, ranges[i]);
    return true;
  }
  return false;
}

export function selectPreviousPlaceholder(target: PlaceholderTarget): boolean {
  const ranges = findPlaceholderRanges(target.state.doc.toString());
  const cursorStart = target.state.selection.main.from;
  for (let i = ranges.length - 1; i >= 0; i--) {
    const isBeforeCursor = ranges[i].to - 1 < cursorStart;
    if (!isBeforeCursor)
      continue;
    selectPlaceholderText(target, ranges[i]);
    return true;
  }
  return false;
}

export function createPlaceholderTab(): Extension {
  return Prec.high(keymap.of([{ key: 'Tab', run: selectNextPlaceholder, shift: selectPreviousPlaceholder }]));
}
