import type { Version } from '../playgroundHistory';
import { formatValueText, listAnswers, readQuestions } from './graphValues';
import { formatWinnerLine, listWinnerGroups } from './winners';

export const NO_NOTES_TEXT = 'No notes yet.';

function isNotePresent(note: string | undefined): note is string {
  return note !== undefined && note !== '';
}

function buildQuote(text: string): string {
  const quotedLines: string[] = [];
  for (const line of text.split('\n'))
    quotedLines.push('> ' + line);
  return quotedLines.join('\n');
}

function listSectionBlocks(title: string, note: string | undefined): string[] {
  const isPresent = isNotePresent(note);
  if (!isPresent)
    return [];
  return [`### ${title}`, note];
}

function listResultNoteBlocks(version: Version, name: string, note: string): string[] {
  const question = readQuestions(version)[name];
  const blocks = [`#### ${name}`, buildQuote(formatValueText(question.instructions))];
  for (const group of listWinnerGroups(listAnswers(version, name)))
    blocks.push(formatWinnerLine(question, group));
  blocks.push(note);
  return blocks;
}

function listResultSectionBlocks(version: Version): string[] {
  const notes = version.resultNotes ?? {};
  const questionBlocks: string[] = [];
  for (const name of Object.keys(notes)) {
    const isPresent = isNotePresent(notes[name]);
    if (isPresent)
      questionBlocks.push(...listResultNoteBlocks(version, name, notes[name]));
  }
  const hasQuestionBlocks = questionBlocks.length > 0;
  if (!hasQuestionBlocks)
    return [];
  return ['### Result notes', ...questionBlocks];
}

function listVersionBlocks(version: Version, previous: Version | undefined): string[] {
  const isStateNoteNew = version.stateNote !== previous?.stateNote;
  const isQuestionsNoteNew = version.questionsNote !== previous?.questionsNote;
  const sectionBlocks = [
    ...listSectionBlocks('State notes', isStateNoteNew ? version.stateNote : undefined),
    ...listSectionBlocks('Questions notes', isQuestionsNoteNew ? version.questionsNote : undefined),
    ...listSectionBlocks('Run comments', version.note),
    ...listResultSectionBlocks(version),
  ];
  const hasSectionBlocks = sectionBlocks.length > 0;
  if (!hasSectionBlocks)
    return [];
  return [`## Version ${version.id} (${version.time})`, ...sectionBlocks];
}

export function buildReportMarkdown(versions: Version[]): string {
  const blocks = ['# Notes report'];
  const versionBlocks: string[] = [];
  for (let i = 0; i < versions.length; i++)
    versionBlocks.push(...listVersionBlocks(versions[i], versions[i - 1]));
  const hasVersionBlocks = versionBlocks.length > 0;
  if (!hasVersionBlocks)
    return [...blocks, NO_NOTES_TEXT].join('\n\n') + '\n';
  return [...blocks, ...versionBlocks].join('\n\n') + '\n';
}
