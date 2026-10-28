import type { Version } from '../playgroundHistory';
import { listChangeBlocks } from './reportChanges';
import { replaceVersionReferences } from './reportReferences';
import { isNotePresent, listResultBlocks } from './reportResults';
// import { formatValueText, listAnswers, readQuestions } from './graphValues';
// import { formatWinnerLine, listWinnerGroups } from './winners';

// export const NO_NOTES_TEXT = 'No notes yet.';
export const NO_NOTES_TEXT = 'No notes or runs yet.';

// function isNotePresent(note: string | undefined): note is string {
//   return note !== undefined && note !== '';
// }

// function buildQuote(text: string): string {
//   const quotedLines: string[] = [];
//   for (const line of text.split('\n'))
//     quotedLines.push('> ' + line);
//   return quotedLines.join('\n');
// }

function listSectionBlocks(title: string, note: string | undefined): string[] {
  const isPresent = isNotePresent(note);
  if (!isPresent)
    return [];
  return [`### ${title}`, note];
}

// function listResultNoteBlocks(version: Version, name: string, note: string): string[] {
//   const question = readQuestions(version)[name];
//   const blocks = [`#### ${name}`, buildQuote(formatValueText(question.instructions))];
//   for (const group of listWinnerGroups(listAnswers(version, name)))
//     blocks.push(formatWinnerLine(question, group));
//   blocks.push(note);
//   return blocks;
// }

// function listResultSectionBlocks(version: Version): string[] {
//   const notes = version.resultNotes ?? {};
//   const questionBlocks: string[] = [];
//   for (const name of Object.keys(notes)) {
//     const isPresent = isNotePresent(notes[name]);
//     if (isPresent)
//       questionBlocks.push(...listResultNoteBlocks(version, name, notes[name]));
//   }
//   const hasQuestionBlocks = questionBlocks.length > 0;
//   if (!hasQuestionBlocks)
//     return [];
//   return ['### Result notes', ...questionBlocks];
// }

function listVersionBlocks(versions: Version[], index: number): string[] {
  const version = versions[index];
  const previous = versions[index - 1];
  const isStateNoteNew = version.stateNote !== previous?.stateNote;
  const isQuestionsNoteNew = version.questionsNote !== previous?.questionsNote;
  const noteBlocks = [
    ...listSectionBlocks('State notes', isStateNoteNew ? version.stateNote : undefined),
    ...listSectionBlocks('Questions notes', isQuestionsNoteNew ? version.questionsNote : undefined),
    ...listSectionBlocks('Run comments', version.note),
  ];
  const resultBlocks = listResultBlocks(versions, index);
  const hasContent = noteBlocks.length > 0 || resultBlocks.length > 0;
  if (!hasContent)
    return [];
  // return [`## Version ${version.id} (${version.time})`, ...listChangeBlocks(version, previous), ...noteBlocks, ...resultBlocks];
  const textBlocks = replaceVersionReferences([...noteBlocks, ...resultBlocks], version);
  return [`## Version ${version.id} (${version.time})`, ...listChangeBlocks(version, previous), ...textBlocks];
}

export function buildReportMarkdown(versions: Version[]): string {
  const blocks = ['# Notes report'];
  const versionBlocks: string[] = [];
  // for (let i = 0; i < versions.length; i++)
  for (let i = versions.length - 1; i >= 0; i--) {
    const blocksOfVersion = listVersionBlocks(versions, i);
    const needsDivider = blocksOfVersion.length > 0 && versionBlocks.length > 0;
    if (needsDivider)
      versionBlocks.push('---');
    versionBlocks.push(...blocksOfVersion);
  }
  const hasVersionBlocks = versionBlocks.length > 0;
  if (!hasVersionBlocks)
    return [...blocks, NO_NOTES_TEXT].join('\n\n') + '\n';
  return [...blocks, ...versionBlocks].join('\n\n') + '\n';
}
