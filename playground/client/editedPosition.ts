import { computeVersionStep } from '../playgroundVersionStep';
import { getQuestionsEditor, getStateEditor } from './editors';
import { computeJsonParseResult } from './jsonParse';
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

export function isEditorTextOverwritingShownVersion(): boolean {
  const stateResult = computeJsonParseResult('state', getStateEditor().state.doc.toString());
  const questionsResult = computeJsonParseResult('questions', getQuestionsEditor().state.doc.toString());
  if (!stateResult.isValid)
    return false;
  if (!questionsResult.isValid)
    return false;
  return computeVersionStep(getShownVersion(), stateResult.value, questionsResult.value) === 'overwrite';
}

export function computePositionCount(): number {
  const isEditedPositionPresent = isEditedPositionKept();
  const isOnlyVersionOverwritten = pageState.versions.length === 1 && isEditorTextOverwritingShownVersion();
  if (isOnlyVersionOverwritten)
    return pageState.versions.length;
  if (isEditedPositionPresent)
    return pageState.versions.length + 1;
  return pageState.versions.length;
}
