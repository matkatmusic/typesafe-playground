import { StateEffect } from '@codemirror/state';
import type { EditorState } from '@codemirror/state';
import type { EditorView, ViewUpdate } from '@codemirror/view';
import { getQuestionsEditor, getStateEditor } from '../editors/editors';

class OtherEditorChangedEffectHolder {
    private static instance: OtherEditorChangedEffectHolder | undefined;
    public readonly effectType = StateEffect.define<null>();
    private constructor() {}
    public static getInstance() {
        OtherEditorChangedEffectHolder.instance ??= new OtherEditorChangedEffectHolder();
        return OtherEditorChangedEffectHolder.instance;
    }
}

export function listBothEditorStates(): EditorState[] {
    return [getStateEditor().state, getQuestionsEditor().state];
}

export function listBothEditorViews(): EditorView[] {
    return [getStateEditor(), getQuestionsEditor()];
}

export function buildOtherEditorRelint(listViews: () => EditorView[]): (update: ViewUpdate) => void {
    function dispatchToOtherEditors(update: ViewUpdate): void {
        const isDocUnchanged = !update.docChanged;
        if (isDocUnchanged)
            return;
        const views = listViews();
        for (let i = 0; i < views.length; i++) {
            const isOtherEditor = views[i] !== update.view;
            if (isOtherEditor)
                views[i].dispatch({ effects: OtherEditorChangedEffectHolder.getInstance().effectType.of(null) });
        }
    }
    return dispatchToOtherEditors;
}

export function isOtherEditorChanged(update: ViewUpdate): boolean {
    for (let i = 0; i < update.transactions.length; i++) {
        const effects = update.transactions[i].effects;
        for (let j = 0; j < effects.length; j++) {
            const isRelintEffect = effects[j].is(OtherEditorChangedEffectHolder.getInstance().effectType);
            if (isRelintEffect)
                return true;
        }
    }
    return false;
}

export function refreshBothEditorLints(): void {
    for (const view of listBothEditorViews())
        view.dispatch({ effects: OtherEditorChangedEffectHolder.getInstance().effectType.of(null) });
}
