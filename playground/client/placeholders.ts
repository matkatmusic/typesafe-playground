import { StateField } from '@codemirror/state';
import type { EditorState, Extension, Transaction } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';
import { buildQuestionLines } from './questionSnippets';
import type { QuestionType } from './questionSnippets';

export interface PlaceholderRange {
  from: number;
  to: number;
}

const FIELD_PATTERN = /\$\{(\d+):([^}]*)\}/g;
const NAME_PATTERN = /^new_(noul|score|choice)_\d+$/;
const placeholderMark = Decoration.mark({ class: 'cm-placeholderValue' });
const selectedPlaceholderMark = Decoration.mark({ class: 'cm-placeholderValue cm-placeholderSelected' });

export function listPlaceholderTexts(): string[] {
  const types: QuestionType[] = ['noul', 'score', 'choice'];
  const texts: string[] = [];
  for (let i = 0; i < types.length; i++) {
    const lines = buildQuestionLines(types[i], 'name');
    for (let j = 0; j < lines.length; j++) {
      const fieldPattern = new RegExp(FIELD_PATTERN.source, 'g');
      let match = fieldPattern.exec(lines[j]);
      while (match !== null) {
        const isNameField = match[1] === '1';
        if (!isNameField)
          texts.push(match[2]);
        match = fieldPattern.exec(lines[j]);
      }
    }
  }
  return texts;
}

const PLACEHOLDER_TEXTS = listPlaceholderTexts();

export function findPlaceholderRanges(text: string): PlaceholderRange[] {
  const ranges: PlaceholderRange[] = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] !== '"') {
      i++;
      continue;
    }
    const start = i;
    i++;
    while (i < text.length) {
      const isClosingQuote = text[i] === '"';
      if (isClosingQuote)
        break;
      const isEscape = text[i] === '\\';
      i += isEscape ? 2 : 1;
    }
    const isClosed = i < text.length;
    if (!isClosed)
      break;
    const inner = text.slice(start + 1, i);
    let isPlaceholder = PLACEHOLDER_TEXTS.includes(inner);
    const isGeneratedName = NAME_PATTERN.test(inner);
    if (isGeneratedName)
      isPlaceholder = true;
    if (isPlaceholder)
      ranges.push({ from: start, to: i + 1 });
    i++;
  }
  return ranges;
}

function isPlaceholderSelected(state: EditorState, range: PlaceholderRange): boolean {
  const { from, to } = state.selection.main;
  const isSelectionEmpty = from === to;
  if (isSelectionEmpty)
    return false;
  const coversInnerText = from <= range.from + 1 && to >= range.to - 1;
  return coversInnerText;
}

export function buildPlaceholderDecorations(state: EditorState): DecorationSet {
  const ranges = findPlaceholderRanges(state.doc.toString());
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

export function createPlaceholders(): Extension {
  return placeholderField;
}
