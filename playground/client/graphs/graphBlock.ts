import type { Question } from '@typesafe-ai/sdk';
import type { Version } from '../../history/playgroundHistory';
import type { GraphBlock, RenderCallback } from './graphTypes';
import { getElement } from '../page/dom';
import { graphState } from './graphState';
import { formatValueText } from './graphValues';
import { createNotesButton } from '../notes/notesButton';
import { moveQuestionIntoView } from '../questions/questionQuickNav';
import { appendReferenceText } from '../backticks/backtickTooltip';
import { replaceReferences } from '../backticks/references';

export function formatGraphTitle(questionNumber: number, name: string, question: Question): string {
  return 'Q' + questionNumber + ' ' + name + ' · ' + formatValueText(question.instructions);
}

function createAverageCheckbox(name: string, onChange: RenderCallback): HTMLInputElement {
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = graphState.averageShownByName[name] === true;
  function updateAverageShown(): void {
    const container = getElement('graphContainerBox');
    const scrollTopBeforeRender = container.scrollTop;
    graphState.averageShownByName[name] = checkbox.checked;
    onChange();
    container.scrollTop = scrollTopBeforeRender;
  }
  checkbox.addEventListener('change', updateAverageShown);
  return checkbox;
}

export function createAverageToggle(name: string, onChange: RenderCallback): HTMLLabelElement {
  const toggle = document.createElement('label');
  toggle.className = 'avg-toggle';
  const checkbox = createAverageCheckbox(name, onChange);
  const text = document.createElement('span');
  text.textContent = ' Show average';
  toggle.appendChild(checkbox);
  toggle.appendChild(text);
  return toggle;
}

function createCollapseHandler(name: string, isCollapsed: boolean, onChange: RenderCallback): () => void {
  function updateCollapsed(): void {
    const container = getElement('graphContainerBox');
    const scrollTopBeforeRender = container.scrollTop;
    graphState.collapsedByName[name] = !isCollapsed;
    onChange();
    container.scrollTop = scrollTopBeforeRender;
    if (isCollapsed)
      getElement('graphBlock' + name).scrollIntoView({ block: 'nearest' });
  }
  return updateCollapsed;
}

export function createCollapseButton(name: string, onChange: RenderCallback): HTMLButtonElement {
  const isCollapsed = graphState.collapsedByName[name] === true;
  const button = document.createElement('button');
  button.className = 'graph-toggle';
  button.textContent = isCollapsed ? '▶' : '▼';
  button.setAttribute('aria-label', isCollapsed ? 'expand graph' : 'collapse graph');
  button.addEventListener('click', createCollapseHandler(name, isCollapsed, onChange));
  return button;
}

export function createQuestionLink(label: string, name: string): HTMLButtonElement {
  const link = document.createElement('button');
  link.type = 'button';
  link.className = 'graph-question-link';
  link.textContent = label;
  function moveToQuestion(): void {
    moveQuestionIntoView(name);
  }
  link.addEventListener('click', moveToQuestion);
  return link;
}

function createGraphBlockElement(name: string): HTMLDivElement {
  const block = document.createElement('div');
  block.className = 'graph-block';
  block.id = 'graphBlock' + name;
  if (graphState.collapsedByName[name] === true)
    block.classList.add('collapsed');
  return block;
}

function createGraphTitle(questionLabel: string, name: string, instructionsText: string, question: Question, version: Version): HTMLDivElement {
  const title = document.createElement('div');
  title.className = 'graph-title';
  title.appendChild(createQuestionLink(questionLabel, name));
  appendReferenceText(title, instructionsText, version.state, question);
  title.title = questionLabel + instructionsText;
  return title;
}

function createGraphTitleRow(name: string, title: HTMLDivElement, onChange: RenderCallback, version: Version): HTMLDivElement {
  const titleRow = document.createElement('div');
  titleRow.className = 'graph-title-row';
  titleRow.appendChild(createCollapseButton(name, onChange));
  titleRow.appendChild(title);
  const isRunCompleted = version.outputs.length > 0;
  if (isRunCompleted)
    titleRow.appendChild(createNotesButton('resultNotesButton' + name, 'Result notes: ' + name, { kind: 'result', question: name }));
  titleRow.appendChild(createAverageToggle(name, onChange));
  return titleRow;
}

export function createGraphBlock(questionNumber: number, name: string, question: Question, onChange: RenderCallback, version: Version): GraphBlock {
  const questionLabel = 'Q' + questionNumber + ' ' + name;
  const formattedInstructions = formatGraphTitle(questionNumber, name, question).slice(questionLabel.length);
  const instructionsText = graphState.isReferencesReplaced ? replaceReferences(formattedInstructions, version.state, question) : formattedInstructions;
  const block = createGraphBlockElement(name);
  const title = createGraphTitle(questionLabel, name, instructionsText, question, version);
  const titleRow = createGraphTitleRow(name, title, onChange, version);
  const box = document.createElement('div');
  box.className = 'chart-box';
  block.appendChild(titleRow);
  block.appendChild(box);
  return { block: block, box: box };
}
