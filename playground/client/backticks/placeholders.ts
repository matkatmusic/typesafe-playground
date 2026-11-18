import { StateField } from '@codemirror/state';
import type { EditorState, Extension, Transaction } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';
import { getPlaceholderRangesField, readPlaceholderRanges } from './placeholderRanges';

export interface PlaceholderRange {
    from: number;
    to: number;
}

class PlaceholderMarks {
    private static instance: PlaceholderMarks | undefined;
    public placeholderMark = Decoration.mark({ class: 'cm-placeholderValue' });
    public selectedPlaceholderMark = Decoration.mark({ class: 'cm-placeholderValue cm-placeholderSelected' });
    private constructor() {}
    public static getInstance() {
        PlaceholderMarks.instance ??= new PlaceholderMarks();
        return PlaceholderMarks.instance;
    }
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
    const ranges = readPlaceholderRanges(state);
    const placeholderMarks = PlaceholderMarks.getInstance();
    const marks = [];
    for (let i = 0; i < ranges.length; i++) {
        const isSelected = isPlaceholderSelected(state, ranges[i]);
        const mark = isSelected ? placeholderMarks.selectedPlaceholderMark : placeholderMarks.placeholderMark;
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

class PlaceholderFieldHolder {
    private static instance: PlaceholderFieldHolder | undefined;
    public field = StateField.define<DecorationSet>({
        create: buildPlaceholderDecorations,
        update: updatePlaceholderDecorations,
        provide: getFieldDecorations,
    });
    private constructor() {}
    public static getInstance() {
        PlaceholderFieldHolder.instance ??= new PlaceholderFieldHolder();
        return PlaceholderFieldHolder.instance;
    }
}

export function getPlaceholderField(): StateField<DecorationSet> {
    return PlaceholderFieldHolder.getInstance().field;
}

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
    return [getPlaceholderRangesField(), getPlaceholderField(), selectedAttributes];
}
