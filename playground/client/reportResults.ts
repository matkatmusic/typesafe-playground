import type { Version } from '../playgroundHistory';
import type { Answer } from './graphTypes';
import { computeSummary, formatValueText, listAnswers, listValues, NOUL_KEY, readQuestions } from './graphValues';
import type { WinnerGroup } from './winners';
import { formatWinnerLine, listWinnerGroups } from './winners';

type Winner = { key: string; average: number };

export function isNotePresent(note: string | undefined): note is string {
  return note !== undefined && note !== '';
}

function buildQuote(text: string): string {
  const quotedLines: string[] = [];
  for (const line of text.split('\n'))
    quotedLines.push('> ' + line);
  return quotedLines.join('\n');
}

function findWinnerGroup(answers: Answer[]): WinnerGroup {
  const groups = listWinnerGroups(answers);
  let winner = groups[0];
  for (const group of groups) {
    const isLarger = group.runs.length > winner.runs.length;
    if (isLarger)
      winner = group;
  }
  return winner;
}

function computeBarAverage(answers: Answer[], group: WinnerGroup): number {
  const barKey = answers[0].type === 'noul' ? NOUL_KEY : group.key;
  return computeSummary(listValues(answers, barKey)).average;
}

function isRunDataPresent(version: Version, name: string): boolean {
  const hasOutputs = version.outputs.length > 0;
  return hasOutputs && name in version.outputs[0].answers;
}

function findPreviousWinner(versions: Version[], index: number, name: string): Winner | undefined {
  for (let i = index - 1; i >= 0; i--) {
    const hasData = isRunDataPresent(versions[i], name);
    if (hasData) {
      const answers = listAnswers(versions[i], name);
      const group = findWinnerGroup(answers);
      return { key: group.key, average: computeBarAverage(answers, group) };
    }
  }
  return undefined;
}

function formatChangeText(current: Winner, previous: Winner | undefined): string {
  if (previous === undefined)
    return '';
  if (previous.key !== current.key)
    return ` · winner was ${previous.key}`;
  const difference = current.average - previous.average;
  const isUnchanged = Math.abs(difference).toFixed(3) === '0.000';
  if (isUnchanged)
    return ' · no change';
  return ` · ${difference > 0 ? '▲' : '▼'} ${Math.abs(difference).toFixed(3)}`;
}

function buildMetricLine(versions: Version[], index: number, name: string): string {
  const version = versions[index];
  const answers = listAnswers(version, name);
  const group = findWinnerGroup(answers);
  const current = { key: group.key, average: computeBarAverage(answers, group) };
  const winnerLine = formatWinnerLine(readQuestions(version)[name], group);
  return `Winner: ${winnerLine} · avg ${current.average.toFixed(3)}${formatChangeText(current, findPreviousWinner(versions, index, name))}`;
}

function listQuestionBlocks(versions: Version[], index: number, name: string): string[] {
  const version = versions[index];
  const note = (version.resultNotes ?? {})[name];
  const noteBlocks = isNotePresent(note) ? [note] : [];
  const hasData = isRunDataPresent(version, name);
  if (!hasData)
    return noteBlocks.length === 0 ? [] : [`#### ${name}`, '(no runs)', ...noteBlocks];
  const quote = buildQuote(formatValueText(readQuestions(version)[name].instructions));
  return [`#### ${name}`, quote, buildMetricLine(versions, index, name), ...noteBlocks];
}

function listResultNames(version: Version): string[] {
  const hasOutputs = version.outputs.length > 0;
  const names = hasOutputs ? Object.keys(version.outputs[0].answers) : [];
  for (const name of Object.keys(version.resultNotes ?? {})) {
    const isNew = !names.includes(name);
    if (isNew)
      names.push(name);
  }
  return names;
}

export function listResultBlocks(versions: Version[], index: number): string[] {
  const questionBlocks: string[] = [];
  for (const name of listResultNames(versions[index]))
    questionBlocks.push(...listQuestionBlocks(versions, index, name));
  const hasQuestionBlocks = questionBlocks.length > 0;
  if (!hasQuestionBlocks)
    return [];
  return ['### Results', ...questionBlocks];
}
