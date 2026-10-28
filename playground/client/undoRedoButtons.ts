import { redoDepth, undoDepth } from '@codemirror/commands';
import { StateEffect } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { getButton } from './dom';
import { getQuestionsEditor, getStateEditor } from './editors';

export function refreshUndoRedoButtons(): void {
  const stateEditorState = getStateEditor().state;
  const questionsEditorState = getQuestionsEditor().state;
  getButton('stateUndoButton').disabled = undoDepth(stateEditorState) === 0;
  getButton('stateRedoButton').disabled = redoDepth(stateEditorState) === 0;
  getButton('questionsUndoButton').disabled = undoDepth(questionsEditorState) === 0;
  getButton('questionsRedoButton').disabled = redoDepth(questionsEditorState) === 0;
}

export function attachUndoRedoButtons(): void {
  const effects = StateEffect.appendConfig.of(EditorView.updateListener.of(refreshUndoRedoButtons));
  getStateEditor().dispatch({ effects });
  getQuestionsEditor().dispatch({ effects });
  refreshUndoRedoButtons();
}
