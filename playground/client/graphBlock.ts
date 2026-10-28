import type { Question } from '@typesafe-ai/sdk';
import type { Version } from '../playgroundHistory';
import type { GraphBlock, RenderCallback } from './graphTypes';
import { graphState } from './graphState';
import { formatValueText } from './graphValues';
import { createNotesButton } from './notesButton';
import { appendReferenceText } from './backtickTooltip';
import { replaceReferences } from './references';

export function formatGraphTitle(questionNumber: number, name: string, question: Question): string {
  return 'Q' + questionNumber + ' ' + name + ' · ' + formatValueText(question.instructions);
}

export function createAverageToggle(name: string, onChange: RenderCallback): HTMLLabelElement {
  const toggle = document.createElement('label');
  toggle.className = 'avg-toggle';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = graphState.averageShownByName[name] === true;
  function updateAverageShown(): void {
    graphState.averageShownByName[name] = checkbox.checked;
    onChange();
  }
  checkbox.addEventListener('change', updateAverageShown);
  const text = document.createElement('span');
  text.textContent = ' Show average';
  toggle.appendChild(checkbox);
  toggle.appendChild(text);
  return toggle;
}

export function createCollapseButton(name: string, onChange: RenderCallback): HTMLButtonElement {
  const isCollapsed = graphState.collapsedByName[name] === true;
  const button = document.createElement('button');
  button.className = 'graph-toggle';
  button.textContent = isCollapsed ? '▶' : '▼';
  button.setAttribute('aria-label', isCollapsed ? 'expand graph' : 'collapse graph');
  function updateCollapsed(): void {
    graphState.collapsedByName[name] = !isCollapsed;
    onChange();
  }
  button.addEventListener('click', updateCollapsed);
  return button;
}

export function createGraphBlock(questionNumber: number, name: string, question: Question, onChange: RenderCallback, version: Version): GraphBlock {
  const formattedTitle = formatGraphTitle(questionNumber, name, question);
  const titleText = graphState.isReferencesReplaced ? replaceReferences(formattedTitle, version.state, version.questions) : formattedTitle;
  const block = document.createElement('div');
  block.className = 'graph-block';
  if (graphState.collapsedByName[name] === true)
    block.classList.add('collapsed');
  const titleRow = document.createElement('div');
  titleRow.className = 'graph-title-row';
  const title = document.createElement('div');
  title.className = 'graph-title';
  // title.textContent = titleText;
  appendReferenceText(title, titleText, version.state, version.questions);
  title.title = titleText;
  titleRow.appendChild(createCollapseButton(name, onChange));
  titleRow.appendChild(title);
  const isRunCompleted = version.outputs.length > 0;
  if (isRunCompleted)
    titleRow.appendChild(createNotesButton('resultNotesButton' + name, 'Result notes: ' + name, { kind: 'result', question: name }));
  titleRow.appendChild(createAverageToggle(name, onChange));
  const box = document.createElement('div');
  box.className = 'chart-box';
  block.appendChild(titleRow);
  block.appendChild(box);
  return { block: block, box: box };
}
