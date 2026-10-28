import { splitKeyPath } from './propertyNames';

export type PathLookup = { isFound: true; value: unknown } | { isFound: false };

export const REFERENCE_PATTERN =/`([^`\s.]+(?:\.[^`\s.]+)*)`/g;
// const ARRAY_INDEX = /^\d+$/;

export function findPathValue(root: unknown, path: string): PathLookup {
  let current = root;
  const steps = splitKeyPath(path);
  const isEmptyPath = steps.length === 0;
  if (isEmptyPath)
    return { isFound: false };
  for (const step of steps) {
    const isContainer = typeof current === 'object' && current !== null;
    if (!isContainer)
      return { isFound: false };
    const isIndexStep = step.startsWith('[');
    const isStepAllowed = isIndexStep === Array.isArray(current);
    if (!isStepAllowed)
      return { isFound: false };
    const key = isIndexStep ? step.slice(1, -1) : step;
    const hasStep = Object.hasOwn(current as object, key);
    if (!hasStep)
      return { isFound: false };
    current = (current as Record<string, unknown>)[key];
  }
  return { isFound: true, value: current };
}

export function formatReferenceValue(value: unknown): string {
  return `'${typeof value === 'string' ? value : JSON.stringify(value)}'`;
}

// export function appendReferenceText(parent: HTMLElement, text: string, state: unknown, questions: unknown): void {
//   let plainStart = 0;
//   for (const match of text.matchAll(REFERENCE_PATTERN)) {
//     const stateLookup = findPathValue(state, match[1]);
//     const lookup = stateLookup.isFound ? stateLookup : findPathValue(questions, match[1]);
//     if (!lookup.isFound)
//       continue;
//     parent.appendChild(document.createTextNode(text.slice(plainStart, match.index)));
//     const span = document.createElement('span');
//     span.className = 'backtick-ref';
//     span.title = formatReferenceValue(lookup.value);
//     span.textContent = match[0];
//     parent.appendChild(span);
//     plainStart = match.index + match[0].length;
//   }
//   parent.appendChild(document.createTextNode(text.slice(plainStart)));
// }

export function replaceReferences(text: string, state: unknown, questions: unknown): string {
  function formatReference(reference: string, path: string): string {
    const stateLookup = findPathValue(state, path);
    if (stateLookup.isFound)
      return formatReferenceValue(stateLookup.value);
    const questionsLookup = findPathValue(questions, path);
    if (questionsLookup.isFound)
      return formatReferenceValue(questionsLookup.value);
    return reference;
  }
  return text.replace(REFERENCE_PATTERN, formatReference);
}
