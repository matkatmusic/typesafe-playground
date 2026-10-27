import { StateEffect, StateField } from '@codemirror/state';
import type { ChangeSet, EditorState, Transaction } from '@codemirror/state';
import { FILL_ANNOTATION } from './editors';
import type { PlaceholderRange } from './placeholders';

const TEMPLATE_FIELD_PATTERN = /\$\{\d+:([^}]*)\}/g;

export const addPlaceholderRanges = StateEffect.define<PlaceholderRange[]>();

export function listTemplateFieldTexts(template: string): string[] {
  const texts: string[] = [];
  for (const match of template.matchAll(TEMPLATE_FIELD_PATTERN))
    texts.push(match[1]);
  return texts;
}

export function findInsertedRanges(text: string, fieldTexts: string[], from: number): PlaceholderRange[] {
  const ranges: PlaceholderRange[] = [];
  let cursor = from;
  for (const fieldText of fieldTexts) {
    const quoted = '"' + fieldText + '"';
    const start = text.indexOf(quoted, cursor);
    if (start < 0)
      throw new Error('inserted text has no field ' + quoted);
    cursor = start + quoted.length;
    ranges.push({ from: start, to: cursor });
  }
  return ranges;
}

export function isRangeTouched(range: PlaceholderRange, changes: ChangeSet): boolean {
  let isTouched = false;
  function markTouch(fromA: number, toA: number): void {
    const isBeforeTextEnd = fromA <= range.to - 1;
    const isAfterTextStart = toA >= range.from + 1;
    const isInsideText = isBeforeTextEnd && isAfterTextStart;
    if (isInsideText)
      isTouched = true;
  }
  changes.iterChangedRanges(markTouch);
  return isTouched;
}

export function movePlaceholderRanges(ranges: PlaceholderRange[], transaction: Transaction): PlaceholderRange[] {
  const kept: PlaceholderRange[] = [];
  for (const range of ranges) {
    const isTouched = isRangeTouched(range, transaction.changes);
    if (!isTouched)
      kept.push({ from: transaction.changes.mapPos(range.from, 1), to: transaction.changes.mapPos(range.to, -1) });
  }
  return kept;
}

export function updatePlaceholderRanges(value: PlaceholderRange[], transaction: Transaction): PlaceholderRange[] {
  const isFill = transaction.docChanged && transaction.annotation(FILL_ANNOTATION) === true;
  let ranges = isFill ? [] : value;
  if (transaction.docChanged)
    ranges = movePlaceholderRanges(ranges, transaction);
  for (const effect of transaction.effects) {
    const isAddEffect = effect.is(addPlaceholderRanges);
    if (isAddEffect)
      ranges = [...ranges, ...effect.value];
  }
  return ranges;
}

function createEmptyRanges(): PlaceholderRange[] {
  return [];
}

export const placeholderRangesField = StateField.define<PlaceholderRange[]>({
  create: createEmptyRanges,
  update: updatePlaceholderRanges,
});

export function readPlaceholderRanges(state: EditorState): PlaceholderRange[] {
  return state.field(placeholderRangesField);
}
