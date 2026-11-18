import { StateField } from '@codemirror/state';
import type { EditorState, Extension, Transaction } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';
import { placeholderRangesField, readPlaceholderRanges } from './placeholderRanges';

export interface PlaceholderRange {
  from: number;
  to: number;
}

const placeholderMark = Decoration.mark({ class: 'cm-placeholderValue' });
const selectedPlaceholderMark = Decoration.mark({ class: 'cm-placeholderValue cm-placeholderSelected' });


function isPlaceholderSelected(state: EditorState, range: PlaceholderRange): boolean {
  const { from, to } = state.selection.main;
  const isSelectionEmpty = from === to;
  if (isSelectionEmpty)
    return false;
  const coversInnerText = from <= range.from + 1 && to >= range.to - 1;
  return coversInnerText;
}

export function buildPlaceholderDecorations(state: EditorState): DecorationSet {
  const ranges = readPlaceholderRanges(state);
  const marks = [];
  for (let i = 0; i < ranges.length; i++) {
    const isSelected = isPlaceholderSelected(state, ranges[i]);
    const mark = isSelected ? selectedPlaceholderMark : placeholderMark;
    marks.push(mark.range(ranges[i].from, ranges[i].to));
  }
  return Decoration.set(marks);
}

function updatePlaceholderDecorations(value: DecorationSet, transaction: Transaction): DecorationSet {
  const hasChanged = transaction.docChanged || transaction.selection !== undefined;
  if (!hasChanged)
    return value;
  return buildPlaceholderDecorations(transaction.state);
}

function getFieldDecorations(field: StateField<DecorationSet>): Extension {
  return EditorView.decorations.from(field);
}

export const placeholderField =StateField.define<DecorationSet>({
  create: buildPlaceholderDecorations,
  update: updatePlaceholderDecorations,
  provide: getFieldDecorations,
});

export function isAnyPlaceholderSelected(state: EditorState): boolean {
  const ranges = readPlaceholderRanges(state);
  for (let i = 0; i < ranges.length; i++) {
    const isSelected = isPlaceholderSelected(state, ranges[i]);
    if (isSelected)
      return true;
  }
  return false;
}

export function readPlaceholderIsSelectedAttributes(state: EditorState): Record<string, string> {
  const isSelected = isAnyPlaceholderSelected(state);
  if (isSelected)
    return { class: 'cm-placeholderIsSelected' };
  return {};
}

export function createPlaceholders(): Extension {
  const selectedAttributes = EditorView.editorAttributes.compute(['doc', 'selection'], readPlaceholderIsSelectedAttributes);
  return [placeholderRangesField, placeholderField, selectedAttributes];
}
