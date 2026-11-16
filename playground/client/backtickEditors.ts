import { StateEffect } from '@codemirror/state';
import type { EditorState } from '@codemirror/state';
import type { EditorView, ViewUpdate } from '@codemirror/view';
import { getQuestionsEditor, getStateEditor } from './editors';

const OTHER_EDITOR_CHANGED = StateEffect.define<null>();

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
        views[i].dispatch({ effects: OTHER_EDITOR_CHANGED.of(null) });
    }
  }
  return dispatchToOtherEditors;
}

export function isOtherEditorChanged(update: ViewUpdate): boolean {
  for (let i = 0; i < update.transactions.length; i++) {
    const effects = update.transactions[i].effects;
    for (let j = 0; j < effects.length; j++) {
      const isRelintEffect = effects[j].is(OTHER_EDITOR_CHANGED);
      if (isRelintEffect)
        return true;
    }
  }
  return false;
}

export function relintBothEditors(): void {
  for (const view of listBothEditorViews())
    view.dispatch({ effects: OTHER_EDITOR_CHANGED.of(null) });
}
