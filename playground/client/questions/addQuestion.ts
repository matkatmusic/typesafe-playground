import { snippet } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';
import { EditorSelection, StateField } from '@codemirror/state';
import type { EditorState, Extension, Transaction } from '@codemirror/state';
import { Decoration, EditorView, WidgetType } from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';
import { createAddQuestionElement } from './addQuestionMenu';
import { getAddPlaceholderRangesEffect, findInsertedRanges, listTemplateFieldTexts } from '../backticks/placeholderRanges';
import { findTopLevelObject } from './questionNames';
import { buildInsertPlan } from './questionSnippets';
import type { QuestionType } from './questionSnippets';

function createPlaceholderDispatch(view: EditorView, fieldTexts: string[], insertFrom: number): (transaction: Transaction) => void {
    function dispatchWithPlaceholders(transaction: Transaction): void {
        const ranges = findInsertedRanges(transaction.newDoc.toString(), fieldTexts, insertFrom);
        const effects = [...transaction.effects, getAddPlaceholderRangesEffect().of(ranges)];
        view.dispatch(view.state.update({ changes: transaction.changes, selection: transaction.selection, effects: effects, scrollIntoView: true }));
    }
    return dispatchWithPlaceholders;
}

export function insertQuestion(view: EditorView, type: QuestionType): void {
    if (view.state.readOnly)
        return;
    const text = view.state.doc.toString();
    const plan = buildInsertPlan(syntaxTree(view.state), text, type);
    const lengthBefore = view.state.doc.length;
    const fieldTexts = listTemplateFieldTexts(plan.template);
    const dispatchWithPlaceholders = createPlaceholderDispatch(view, fieldTexts, plan.from);
    snippet(plan.template)({ state: view.state, dispatch: dispatchWithPlaceholders }, null, plan.from, plan.to);
    const insertedEnd = plan.to + view.state.doc.length - lengthBefore;
    const insertedRange = EditorSelection.range(plan.from, insertedEnd);
    view.dispatch({ effects: EditorView.scrollIntoView(insertedRange, { y: 'nearest' }) });
    view.focus();
}

class AddQuestionWidget extends WidgetType {
    // eslint-disable-next-line no-restricted-syntax
    public toDOM(view: EditorView): HTMLElement {
        function insertPicked(type: QuestionType): void {
            insertQuestion(view, type);
        }
        return createAddQuestionElement(insertPicked);
    }

    // eslint-disable-next-line no-restricted-syntax
    public eq(): boolean {
        return true;
    }
}

export function findClosingBracePosition(state: EditorState): number | null {
    const rootNode = findTopLevelObject(syntaxTree(state));
    if (rootNode === null)
        return null;
    const closeBrace = rootNode.lastChild;
    if (closeBrace === null)
        return null;
    if (closeBrace.name !== '}')
        return null;
    return closeBrace.from;
}

function buildDecorations(state: EditorState): DecorationSet {
    const position = findClosingBracePosition(state);
    if (position === null)
        return Decoration.none;
    const addQuestionDecoration = Decoration.widget({ widget: new AddQuestionWidget(), block: true, side: -1 });
    return Decoration.set([addQuestionDecoration.range(position)]);
}

function updateDecorations(value: DecorationSet, transaction: Transaction): DecorationSet {
    if (!transaction.docChanged)
        return value;
    return buildDecorations(transaction.state);
}

function getFieldDecorations(field: StateField<DecorationSet>): Extension {
    return EditorView.decorations.from(field);
}

export function createAddQuestion(): Extension {
    const addQuestionField = StateField.define<DecorationSet>({
        create: buildDecorations,
        update: updateDecorations,
        provide: getFieldDecorations,
    });
    return addQuestionField;
}
