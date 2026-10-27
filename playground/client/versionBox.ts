import type { ViewUpdate } from '@codemirror/view';
import { renderCostAndTokens } from './costTokens';
import { getElement } from './dom';
import { FILL_ANNOTATION, getStateEditor, renderResultJson, renderStateJson } from './editors';
import { markPageChanged } from './pageChanged';
import { getShownVersion, pageState } from './state';
import { computeWrappedIndex, createEditedVersion, formatVersionLabel, isStateEdited } from './versionLabel';

const TYPING_TARGET_SELECTOR = 'input, textarea, select, dialog, .cm-editor';

export function refreshVersionBox(): void {
  const { versions, index } = pageState;
  const shownVersion = getShownVersion();
  const stateText = getStateEditor().state.doc.toString();
  const isEdited = isStateEdited(stateText, shownVersion);
  const version = isEdited ? createEditedVersion(shownVersion, versions.length) : shownVersion;
  const shownNumber = isEdited ? versions.length + 1 : index + 1;
  const versionCount = isEdited ? versions.length + 1 : versions.length;
  getElement('versionLabel').textContent = formatVersionLabel(shownNumber, versionCount, version.time, version.calls);
}

export function renderShownVersion(): void {
  const version = getShownVersion();
  renderStateJson(version.state);
  refreshVersionBox();
  renderCostAndTokens(version);
  renderResultJson(version.outputs);
}

export function renderLastVersion(): void {
  pageState.index = pageState.versions.length - 1;
  renderShownVersion();
}

export function moveByVersions(step: number): void {
  pageState.index = computeWrappedIndex(pageState.index, step, pageState.versions.length);
  renderShownVersion();
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
  for (const transaction of update.transactions) {
    const isFill = transaction.annotation(FILL_ANNOTATION) === true;
    if (!isFill)
      markPageChanged();
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
