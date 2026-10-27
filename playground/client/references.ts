export type PathLookup = { isFound: true; value: unknown } | { isFound: false };

const REFERENCE_PATTERN = /`([^`\s.]+(?:\.[^`\s.]+)*)`/g;
const ARRAY_INDEX = /^\d+$/;

export function findPathValue(root: unknown, path: string): PathLookup {
  let current = root;
  for (const step of path.split('.')) {
    const isContainer = typeof current === 'object' && current !== null;
    if (!isContainer)
      return { isFound: false };
    const isStepAllowed = Array.isArray(current) ? ARRAY_INDEX.test(step) : true;
    if (!isStepAllowed)
      return { isFound: false };
    const hasStep = Object.hasOwn(current as object, step);
    if (!hasStep)
      return { isFound: false };
    current = (current as Record<string, unknown>)[step];
  }
  return { isFound: true, value: current };
}

export function formatReferenceValue(value: unknown): string {
  return `'${typeof value === 'string' ? value : JSON.stringify(value)}'`;
}

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
