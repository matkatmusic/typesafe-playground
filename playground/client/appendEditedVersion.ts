import type { Version } from '../playgroundHistory';
import { computeVersionStep } from '../playgroundVersionStep';
import { renderCostAndTokens } from './costTokens';
import { getElement } from './dom';
import { getQuestionsEditor, getStateEditor, renderResultJson } from './editors';
import { renderGraphs } from './graphs';
import { attachInfoBox } from './infoBox';
import { computeJsonParseResult } from './jsonParse';
import { isJsonObject, isQuestionsObject } from './jsonObjectGuards';
import { applyNoteBox } from './noteBox';
import { applyPinButtons } from './pinButtons';
import { saveInheritedNote } from './saveVersionNote';
import { getShownVersion, pageState } from './state';
import { sendJson } from './versionActions';
import { updateVersionArrows } from './versionArrows';
import { refreshVersionBox } from './versionBox';
import { isJsonTextEdited, NOT_RUN_TIME } from './versionLabel';
import { renderWinners } from './winnersDom';

type EditedInputs = { state: Version['state']; questions: Version['questions'] };

function setErrorLineText(message: string): void {
  getElement('errorLine').textContent = message;
}

function validateInputObjects(stateValue: unknown, questionsValue: unknown): EditedInputs | null {
  const isStateObject = isJsonObject(stateValue);
  if (!isStateObject) {
    setErrorLineText('state must be a JSON object');
    return null;
  }
  const isQuestionsValid = isQuestionsObject(questionsValue);
  if (!isQuestionsValid) {
    setErrorLineText('questions must be a JSON object');
    return null;
  }
  return { state: stateValue, questions: questionsValue };
}

function readEditedInputs(stateText: string, questionsText: string): EditedInputs | null {
  const stateResult = computeJsonParseResult('state', stateText);
  if (!stateResult.isValid) {
    setErrorLineText(stateResult.errorMessage);
    return null;
  }
  const questionsResult = computeJsonParseResult('questions', questionsText);
  if (!questionsResult.isValid) {
    setErrorLineText(questionsResult.errorMessage);
    return null;
  }
  return validateInputObjects(stateResult.value, questionsResult.value);
}

function buildSentVersions(shownVersion: Version, inputs: EditedInputs, isOverwriting: boolean): Version[] {
  // const newVersion: Version = { id: pageState.versions.length + 1, time: NOT_RUN_TIME, state: stateResult.value, questions: questionsResult.value, calls: 0, outputs: [] };
  const newVersion: Version = { time: NOT_RUN_TIME, state: inputs.state, questions: inputs.questions, calls: 0, outputs: [] };
  const overwrittenVersion: Version = { ...shownVersion, state: inputs.state, questions: inputs.questions };
  const sentVersions = [...pageState.versions];
  if (isOverwriting)
    sentVersions[pageState.index] = overwrittenVersion;
  else
    sentVersions.push(newVersion);
  return sentVersions;
}

async function saveOpenedVersions(sentVersions: Version[], isOverwriting: boolean): Promise<void> {
  const response = await sendJson('/open', { versions: sentVersions });
  const opened: { versions: Version[] } = await response.json();
  pageState.versions = opened.versions;
  if (!isOverwriting)
    pageState.index = opened.versions.length - 1;
  pageState.editedDraft = null;
}

async function saveInheritedNotes(shownVersion: Version, appendedVersion: Version, isOverwriting: boolean, isStateEdited: boolean, isQuestionsEdited: boolean): Promise<void> {
  const isStateInherited = !isOverwriting && !isStateEdited;
  const isQuestionsInherited = !isOverwriting && !isQuestionsEdited;
  await saveInheritedNote('state', shownVersion.stateNote, isStateInherited, appendedVersion);
  await saveInheritedNote('questions', shownVersion.questionsNote, isQuestionsInherited, appendedVersion);
}

function renderAppendedVersion(appendedVersion: Version): void {
  applyNoteBox(appendedVersion);
  refreshVersionBox();
  renderCostAndTokens(appendedVersion);
  renderResultJson(appendedVersion.outputs);
  renderGraphs(appendedVersion, getElement('graphContainerBox'), attachInfoBox);
  renderWinners(appendedVersion, getElement('winnerBox'));
  updateVersionArrows();
  applyPinButtons();
}

async function appendParsedVersion(shownVersion: Version, stateText: string, questionsText: string, isStateEdited: boolean, isQuestionsEdited: boolean): Promise<boolean> {
  const inputs = readEditedInputs(stateText, questionsText);
  if (inputs === null)
    return false;
  const step = computeVersionStep(shownVersion, inputs.state, inputs.questions);
  if (step === 'keep')
    return true;
  const isOverwriting = step === 'overwrite';
  const sentVersions = buildSentVersions(shownVersion, inputs, isOverwriting);
  await saveOpenedVersions(sentVersions, isOverwriting);
  const appendedVersion = getShownVersion();
  await saveInheritedNotes(shownVersion, appendedVersion, isOverwriting, isStateEdited, isQuestionsEdited);
  renderAppendedVersion(appendedVersion);
  return true;
}

export async function appendEditedVersion(): Promise<boolean> {
  const shownVersion = getShownVersion();
  const stateText = getStateEditor().state.doc.toString();
  const questionsText = getQuestionsEditor().state.doc.toString();
  const isStateEdited = isJsonTextEdited(stateText, shownVersion.state);
  const isQuestionsEdited = isJsonTextEdited(questionsText, shownVersion.questions);
  const isEdited = isStateEdited || isQuestionsEdited;
  if (!isEdited)
    return true;
  return appendParsedVersion(shownVersion, stateText, questionsText, isStateEdited, isQuestionsEdited);
}
