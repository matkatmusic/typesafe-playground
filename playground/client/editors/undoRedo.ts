import { redo, undo } from '@codemirror/commands';
import { getQuestionsEditor, getStateEditor } from './editors';

export function applyStateUndo(): void {
  undo(getStateEditor());
}

export function applyStateRedo(): void {
  redo(getStateEditor());
}

export function applyQuestionsUndo(): void {
  undo(getQuestionsEditor());
}

export function applyQuestionsRedo(): void {
  redo(getQuestionsEditor());
}
