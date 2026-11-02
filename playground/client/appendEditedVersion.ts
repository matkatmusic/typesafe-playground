import type { Version } from '../playgroundHistory';
import { computeVersionStep } from '../playgroundVersionStep';
import { renderCostAndTokens } from './costTokens';
import { getElement } from './dom';
import { getQuestionsEditor, getStateEditor, renderResultJson } from './editors';
import { renderGraphs } from './graphs';
import { attachInfoBox } from './infoBox';
import { computeJsonParseResult } from './jsonParse';
import { applyNoteBox } from './noteBox';
import { applyPinButtons } from './pinButtons';
import { saveInheritedNote } from './saveVersionNote';
import { getShownVersion, pageState } from './state';
import { sendJson } from './versionActions';
import { updateVersionArrows } from './versionArrows';
import { refreshVersionBox } from './versionBox';
import { isJsonTextEdited, NOT_RUN_TIME } from './versionLabel';
import { renderWinners } from './winnersDom';

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
  const step = computeVersionStep(shownVersion, stateResult.value, questionsResult.value);
  if (step === 'keep')
    return true;
  const isOverwriting = step === 'overwrite';
  // const newVersion: Version = { id: pageState.versions.length + 1, time: NOT_RUN_TIME, state: stateResult.value, questions: questionsResult.value, calls: 0, outputs: [] };
  const newVersion: Version = { time: NOT_RUN_TIME, state: stateResult.value, questions: questionsResult.value, calls: 0, outputs: [] };
  const overwrittenVersion: Version = { ...shownVersion, state: stateResult.value, questions: questionsResult.value };
  const sentVersions = [...pageState.versions];
  if (isOverwriting)
    sentVersions[pageState.index] = overwrittenVersion;
  else
    sentVersions.push(newVersion);
  const response = await sendJson('/open', { versions: sentVersions });
  const opened: { versions: Version[] } = await response.json();
  pageState.versions = opened.versions;
  if (!isOverwriting)
    pageState.index = opened.versions.length - 1;
  pageState.editedDraft = null;
  const appendedVersion = getShownVersion();
  const isStateInherited = !isOverwriting && !isStateEdited;
  const isQuestionsInherited = !isOverwriting && !isQuestionsEdited;
  await saveInheritedNote('state', shownVersion.stateNote, isStateInherited, appendedVersion);
  await saveInheritedNote('questions', shownVersion.questionsNote, isQuestionsInherited, appendedVersion);
  applyNoteBox(appendedVersion);
  refreshVersionBox();
  renderCostAndTokens(appendedVersion);
  renderResultJson(appendedVersion.outputs);
  renderGraphs(appendedVersion, getElement('graphContainerBox'), attachInfoBox);
  renderWinners(appendedVersion, getElement('winnerBox'));
  updateVersionArrows();
  applyPinButtons();
  return true;
}
