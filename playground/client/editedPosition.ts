import { getQuestionsEditor, getStateEditor } from './editors';
import { getShownVersion, pageState } from './state';
import { isJsonTextEdited } from './versionLabel';

export function isEditorTextEdited(): boolean {
  const shownVersion = getShownVersion();
  const isStateEdited = isJsonTextEdited(getStateEditor().state.doc.toString(), shownVersion.state);
  const isQuestionsEdited = isJsonTextEdited(getQuestionsEditor().state.doc.toString(), shownVersion.questions);
  return isStateEdited || isQuestionsEdited;
}

export function isEditedPositionKept(): boolean {
  const isDraftKept = pageState.editedDraft !== null;
  return isDraftKept || isEditorTextEdited();
}

export function computePositionCount(): number {
  const isEditedPositionPresent = isEditedPositionKept();
  if (isEditedPositionPresent)
    return pageState.versions.length + 1;
  return pageState.versions.length;
}
