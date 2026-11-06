import type { Version } from '../playgroundHistory';
// import { findPathValue, formatReferenceValue, REFERENCE_PATTERN } from './references';
import { findReferenceValue } from '../typesafe-checks/typesafeChecks';
import { formatReferenceValue, REFERENCE_PATTERN } from './references';
import { readQuestions } from './graphValues';

const SHORT_REFERENCE_LIMIT = 40;

// function findReferenceText(path: string, version: Version): string | undefined {
//   const stateLookup = findPathValue(version.state, path);
//   if (stateLookup.isFound)
//     return formatReferenceValue(stateLookup.value);
//   const questionsLookup = findPathValue(version.questions, path);
//   if (questionsLookup.isFound)
//     return formatReferenceValue(questionsLookup.value);
//   return undefined;
// }
function findReferenceText(path: string, version: Version, question: unknown): string | undefined {
  const lookup = findReferenceValue(version.state, question, path);
  if (lookup.isFound)
    return formatReferenceValue(lookup.value);
  return undefined;
}

// function replaceBlockReferences(block: string, version: Version, longValues: Map<string, string>): string {
function replaceBlockReferences(block: string, version: Version, question: unknown, longValues: Map<string, string>): string {
  function replaceReference(reference: string, path: string): string {
    // const text = findReferenceText(path, version);
    const text = findReferenceText(path, version, question);
    const isMissing = text === undefined;
    if (isMissing)
      return reference;
    const isShort = text.length <= SHORT_REFERENCE_LIMIT && !text.includes('\n');
    if (isShort)
      return text;
    longValues.set(path, text);
    return reference;
  }
  return block.replace(REFERENCE_PATTERN, replaceReference);
}

function formatTableCell(text: string): string {
  const withoutNewlines = text.replaceAll('\n', ' ');
  return withoutNewlines.replaceAll('|', '\\|');
}

function buildReferenceTable(longValues: Map<string, string>): string {
  const rows = ['| Name | Value |', '|---|---|'];
  for (const [path, text] of longValues)
    rows.push(`| \`${path}\` | ${formatTableCell(text)} |`);
  return rows.join('\n');
}

export function replaceVersionReferences(blocks: string[], version: Version): string[] {
  const longValues = new Map<string, string>();
  const replacedBlocks: string[] = [];
  // for (const block of blocks)
  //   replacedBlocks.push(replaceBlockReferences(block, version, longValues));
  // ponytail: question comes from the last '#### name' heading; a note starting with '#### ' is misread.
  let question: unknown = undefined;
  for (const block of blocks) {
    if (block.startsWith('### '))
      question = undefined;
    if (block.startsWith('#### '))
      question = readQuestions(version)[block.slice('#### '.length)];
    replacedBlocks.push(replaceBlockReferences(block, version, question, longValues));
  }
  const hasLongValues = longValues.size > 0;
  if (!hasLongValues)
    return replacedBlocks;
  return [...replacedBlocks, '### References', buildReferenceTable(longValues)];
}
