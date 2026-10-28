import type { ViewUpdate } from '@codemirror/view';
import { renderCostAndTokens } from './costTokens';
import { getElement } from './dom';
import { computePositionCount, isEditorTextEdited } from './editedPosition';
// import { FILL_ANNOTATION, getQuestionsEditor, getStateEditor, renderQuestionsJson, renderResultJson, renderStateJson, replaceEditorText } from './editors';
import { FILL_ANNOTATION, fillEditorText, getQuestionsEditor, getStateEditor, renderQuestionsJson, renderResultJson, renderStateJson } from './editors';
import { renderGraphs } from './graphs';
import { attachInfoBox } from './infoBox';
import { applyNoteBox } from './noteBox';
import { markPageChanged } from './pageChanged';
import { applyPinButtons } from './pinButtons';
import { getShownVersion, pageState } from './state';
import { isVersionMovePossible, updateVersionArrows } from './versionArrows';
import { computeWrappedIndex, createEditedVersion, formatVersionLabel, isJsonTextEdited } from './versionLabel';
import { renderWinners } from './winnersDom';

const TYPING_TARGET_SELECTOR = 'input, textarea, select, dialog, .cm-editor';

export function refreshVersionBox(): void {
  const { versions, index } = pageState;
  const shownVersion = getShownVersion();
  const stateText = getStateEditor().state.doc.toString();
  const questionsText = getQuestionsEditor().state.doc.toString();
  const isStateEdited = isJsonTextEdited(stateText, shownVersion.state);
  const isQuestionsEdited = isJsonTextEdited(questionsText, shownVersion.questions);
  const isEdited = isStateEdited || isQuestionsEdited;
  const version = isEdited ? createEditedVersion(shownVersion, versions.length) : shownVersion;
  const shownNumber = isEdited ? versions.length + 1 : index + 1;
  // const versionCount = isEdited ? versions.length + 1 : versions.length;
  const versionCount = computePositionCount();
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

export function moveByVersions(step: number): void {
  const isMovePossible = isVersionMovePossible();
  if (!isMovePossible)
    return;
  // pageState.index = computeWrappedIndex(pageState.index, step, pageState.versions.length);
  // renderShownVersion();
  const isEdited = isEditorTextEdited();
  if (isEdited)
    pageState.editedDraft = { state: getStateEditor().state.doc.toString(), questions: getQuestionsEditor().state.doc.toString(), baseIndex: pageState.index };
  const currentPosition = isEdited ? pageState.versions.length : pageState.index;
  const targetPosition = computeWrappedIndex(currentPosition, step, computePositionCount());
  const draft = pageState.editedDraft;
  const isEditedTarget = targetPosition === pageState.versions.length;
  if (!isEditedTarget) {
    pageState.index = targetPosition;
    renderShownVersion();
    return;
  }
  if (draft === null)
    throw new Error('the edited position has no draft');
  pageState.index = draft.baseIndex;
  renderShownVersion();
  // replaceEditorText(getStateEditor(), draft.state);
  // replaceEditorText(getQuestionsEditor(), draft.questions);
  fillEditorText(getStateEditor(), draft.state);
  fillEditorText(getQuestionsEditor(), draft.questions);
  refreshVersionBox();
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
