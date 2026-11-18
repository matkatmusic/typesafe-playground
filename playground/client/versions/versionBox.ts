import type { ViewUpdate } from '@codemirror/view';
import { renderCostAndTokens } from '../runs/costTokens';
import { getElement } from '../page/dom';
import { computePositionCount, isEditorTextEdited, isEditorTextOverwritingShownVersion } from './editedPosition';
import { FILL_ANNOTATION, fillEditorText, getQuestionsEditor, getStateEditor, renderQuestionsJson, renderResultJson, renderStateJson } from '../editors/editors';
import { renderGraphs } from '../graphs/graphs';
import { attachInfoBox } from '../infoBox/infoBox';
import { applyNoteBox } from '../notes/noteBox';
import { markPageChanged } from '../page/pageChanged';
import { applyPinButtons } from '../pins/pinButtons';
import { getShownVersion, pageState } from '../page/state';
import { isVersionMovePossible, updateVersionArrows } from './versionArrows';
import { computeWrappedIndex, createEditedVersion, formatVersionLabel, isJsonTextEdited } from './versionLabel';
import { renderWinners } from '../runs/winnersDom';

const TYPING_TARGET_SELECTOR = 'input, textarea, select, dialog, .cm-editor';

export function refreshVersionBox(): void {
  const { versions, index } = pageState;
  const shownVersion = getShownVersion();
  const stateText = getStateEditor().state.doc.toString();
  const questionsText = getQuestionsEditor().state.doc.toString();
  const isStateEdited = isJsonTextEdited(stateText, shownVersion.state);
  const isQuestionsEdited = isJsonTextEdited(questionsText, shownVersion.questions);
  const isEdited = isStateEdited || isQuestionsEdited;
  const version = isEdited ? createEditedVersion(shownVersion) : shownVersion;
  const isOverwriting = isEditorTextOverwritingShownVersion();
  const shownNumber = isEdited && !isOverwriting ? versions.length + 1 : index + 1;
  const versionCount = isOverwriting ? versions.length : computePositionCount();
  applyNoteBox(version);
  getElement('versionLabel').textContent = formatVersionLabel(shownNumber, versionCount, version.time, version.calls);
}

export function renderShownVersion(): void {
  const version = getShownVersion();
  applyNoteBox(version);
  renderStateJson(version.state);
  renderQuestionsJson(version.questions);
  refreshVersionBox();
  renderCostAndTokens(version);
  renderResultJson(version.outputs);
  renderGraphs(version, getElement('graphContainerBox'), attachInfoBox);
  renderWinners(version, getElement('winnerBox'));
  updateVersionArrows();
  applyPinButtons();
}

export function renderLastVersion(): void {
  pageState.index = pageState.versions.length - 1;
  renderShownVersion();
}

function saveEditedDraft(): void {
  pageState.editedDraft = { state: getStateEditor().state.doc.toString(), questions: getQuestionsEditor().state.doc.toString(), baseIndex: pageState.index };
}

function renderEditedDraft(): void {
  const draft = pageState.editedDraft;
  if (draft === null)
    throw new Error('the edited position has no draft');
  pageState.index = draft.baseIndex;
  renderShownVersion();
  fillEditorText(getStateEditor(), draft.state);
  fillEditorText(getQuestionsEditor(), draft.questions);
  refreshVersionBox();
}

function renderTargetPosition(targetPosition: number): void {
  const isEditedTarget = targetPosition === pageState.versions.length;
  if (isEditedTarget) {
    renderEditedDraft();
    return;
  }
  pageState.index = targetPosition;
  renderShownVersion();
}

export function moveByVersions(step: number): void {
  const isMovePossible = isVersionMovePossible();
  if (!isMovePossible)
    return;
  const isEdited = isEditorTextEdited();
  if (isEdited)
    saveEditedDraft();
  const currentPosition = isEdited ? pageState.versions.length : pageState.index;
  const targetPosition = computeWrappedIndex(currentPosition, step, computePositionCount());
  renderTargetPosition(targetPosition);
}

export function moveToPreviousVersion(): void {
  moveByVersions(-1);
}

export function moveToNextVersion(): void {
  moveByVersions(1);
}

export function updateOnEditorChange(update: ViewUpdate): void {
  if (!update.docChanged)
    return;
  refreshVersionBox();
  updateVersionArrows();
  for (const transaction of update.transactions) {
    const isFill = transaction.annotation(FILL_ANNOTATION) === true;
    if (!isFill)
      markPageChanged('last edited');
  }
}

export function computeArrowStep(key: string): number {
  if (key === 'ArrowLeft')
    return -1;
  if (key === 'ArrowRight')
    return 1;
  return 0;
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element))
    throw new Error('keydown target is not an element');
  return target.closest(TYPING_TARGET_SELECTOR) !== null;
}

export function moveOnArrowKey(event: KeyboardEvent): void {
  const step = computeArrowStep(event.key);
  if (step === 0)
    return;
  const isTyping = isTypingTarget(event.target);
  if (isTyping)
    return;
  moveByVersions(step);
}
