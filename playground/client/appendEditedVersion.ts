import type { Version } from '../playgroundHistory';
import { getElement } from './dom';
import { getQuestionsEditor, getStateEditor } from './editors';
import { computeJsonParseResult } from './jsonParse';
import { applyPinButtons } from './pinButtons';
import { getShownVersion, pageState } from './state';
import { sendJson } from './versionActions';
import { updateVersionArrows } from './versionArrows';
import { refreshVersionBox } from './versionBox';
import { isJsonTextEdited, NOT_RUN_TIME } from './versionLabel';

export async function appendEditedVersion(): Promise<boolean> {
  const shownVersion = getShownVersion();
  const stateText = getStateEditor().state.doc.toString();
  const questionsText = getQuestionsEditor().state.doc.toString();
  const isStateEdited = isJsonTextEdited(stateText, shownVersion.state);
  const isQuestionsEdited = isJsonTextEdited(questionsText, shownVersion.questions);
  const isEdited = isStateEdited || isQuestionsEdited;
  if (!isEdited)
    return true;
  const stateResult = computeJsonParseResult('state', stateText);
  if (!stateResult.isValid) {
    getElement('errorLine').textContent = stateResult.errorMessage;
    return false;
  }
  const questionsResult = computeJsonParseResult('questions', questionsText);
  if (!questionsResult.isValid) {
    getElement('errorLine').textContent = questionsResult.errorMessage;
    return false;
  }
  const newVersion: Version = { id: pageState.versions.length + 1, time: NOT_RUN_TIME, state: stateResult.value, questions: questionsResult.value, calls: 0, outputs: [] };
  const response = await sendJson('/open', { versions: [...pageState.versions, newVersion] });
  const opened: { versions: Version[] } = await response.json();
  pageState.versions = opened.versions;
  pageState.index = opened.versions.length - 1;
  refreshVersionBox();
  updateVersionArrows();
  applyPinButtons();
  return true;
}
