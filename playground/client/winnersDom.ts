import type { Question } from '@typesafe-ai/sdk';
import type { Version } from '../playgroundHistory';
import type { Answer } from './graphTypes';
import { graphState } from './graphState';
import { isRunDataPresent } from './graphs';
import { formatValueText, listAnswers, readQuestions } from './graphValues';
import { appendReferenceText, replaceReferences } from './references';
import { formatWinnerLine, listWinnerGroups } from './winners';

export function createQuestionResultLabel(question: Question, answers: Answer[], formatText: (text: string) => string, version: Version): HTMLDivElement {
  const label = document.createElement('div');
  const instructionLine = document.createElement('div');
  instructionLine.className = 'winner-instructions';
  // instructionLine.textContent = formatText(formatValueText(question.instructions));
  appendReferenceText(instructionLine, formatText(formatValueText(question.instructions)), version.state, version.questions);
  label.appendChild(instructionLine);
  for (const group of listWinnerGroups(answers)) {
    const winnerLine = document.createElement('div');
    winnerLine.className = 'winner-line';
    // winnerLine.textContent = formatText(formatWinnerLine(question, group));
    appendReferenceText(winnerLine, formatText(formatWinnerLine(question, group)), version.state, version.questions);
    label.appendChild(winnerLine);
  }
  return label;
}

function copyText(text: string): string {
  return text;
}

export function buildTextFormatter(version: Version): (text: string) => string {
  function replaceVersionReferences(text: string): string {
    return replaceReferences(text, version.state, version.questions);
  }
  return graphState.isReferencesReplaced ? replaceVersionReferences : copyText;
}

export function renderWinners(version: Version, container: HTMLElement): void {
  const title = document.createElement('div');
  title.id = 'winnerLabel';
  title.className = 'other-label';
  title.textContent = 'Winners:';
  container.replaceChildren(title);
  const questions = readQuestions(version);
  const formatText = buildTextFormatter(version);
  for (const name of Object.keys(questions)) {
    const isDataPresent = isRunDataPresent(version, name);
    if (isDataPresent)
      container.appendChild(createQuestionResultLabel(questions[name], listAnswers(version, name), formatText, version));
  }
}
