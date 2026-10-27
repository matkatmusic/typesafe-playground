import type { Question } from '@typesafe-ai/sdk';
import type { Version } from '../playgroundHistory';
import type { Answer } from './graphTypes';
import { isRunDataPresent } from './graphs';
import { formatValueText, listAnswers, readQuestions } from './graphValues';
import { formatWinnerLine, listWinnerGroups } from './winners';

export function createQuestionResultLabel(question: Question, answers: Answer[]): HTMLDivElement {
  const label = document.createElement('div');
  const instructionLine = document.createElement('div');
  instructionLine.className = 'winner-instructions';
  instructionLine.textContent = formatValueText(question.instructions);
  label.appendChild(instructionLine);
  for (const group of listWinnerGroups(answers)) {
    const winnerLine = document.createElement('div');
    winnerLine.className = 'winner-line';
    winnerLine.textContent = formatWinnerLine(question, group);
    label.appendChild(winnerLine);
  }
  return label;
}

export function renderWinners(version: Version, container: HTMLElement): void {
  const title = document.createElement('div');
  title.id = 'winnerLabel';
  title.className = 'other-label';
  title.textContent = 'Winners:';
  container.replaceChildren(title);
  const questions = readQuestions(version);
  for (const name of Object.keys(questions)) {
    const isDataPresent = isRunDataPresent(version, name);
    if (isDataPresent)
      container.appendChild(createQuestionResultLabel(questions[name], listAnswers(version, name)));
  }
}
