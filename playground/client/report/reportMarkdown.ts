import type { Version } from '../../history/playgroundHistory';
import { listChangeBlocks } from './reportChanges';
import { replaceVersionReferences } from './reportReferences';
import { isNotePresent, listResultBlocks } from './reportResults';

export const NO_NOTES_TEXT = 'No notes or runs yet.';
export const PLACEHOLDER_NOTE_TEXT = 'Placeholders (`name`) are used. See the References table below for the actual values.';



function listSectionBlocks(title: string, note: string | undefined): string[] {
  const isPresent = isNotePresent(note);
  if (!isPresent)
    return [];
  return [`### ${title}`, note];
}



function listVersionNoteBlocks(version: Version, previous: Version | undefined): string[] {
  const isStateNoteNew = version.stateNote !== previous?.stateNote;
  const isQuestionsNoteNew = version.questionsNote !== previous?.questionsNote;
  return [
    ...listSectionBlocks('State notes', isStateNoteNew ? version.stateNote : undefined),
    ...listSectionBlocks('Questions notes', isQuestionsNoteNew ? version.questionsNote : undefined),
    ...listSectionBlocks('Run comments', version.note),
  ];
}

function listVersionBlocks(versions: Version[], index: number): string[] {
  const version = versions[index];
  const previous = versions[index - 1];
  const noteBlocks = listVersionNoteBlocks(version, previous);
  const resultBlocks = listResultBlocks(versions, index);
  const hasContent = noteBlocks.length > 0 || resultBlocks.length > 0;
  if (!hasContent)
    return [];
  const textBlocks = replaceVersionReferences([...noteBlocks, ...resultBlocks], version);
  const hasReferences = textBlocks.includes('### References');
  const placeholderBlocks = hasReferences ? [PLACEHOLDER_NOTE_TEXT] : [];
  return [`## Version ${index + 1} (${version.time})`, ...placeholderBlocks, ...listChangeBlocks(version, previous), ...textBlocks];
}

export function buildReportMarkdown(versions: Version[]): string {
  const blocks = ['# Notes report'];
  const versionBlocks: string[] = [];
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
