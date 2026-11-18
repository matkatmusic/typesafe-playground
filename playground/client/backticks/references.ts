import { findReferenceValue, REFERENCE_PATTERN } from '../../typesafe-checks/typesafeChecks';
export { findPathValue, REFERENCE_PATTERN } from '../../typesafe-checks/typesafeChecks';
export type { PathLookup } from '../../typesafe-checks/typesafeChecks';




export function formatReferenceValue(value: unknown): string {
  return `'${typeof value === 'string' ? value : JSON.stringify(value)}'`;
}


export function replaceReferences(text: string, state: unknown, question: unknown): string {
  function formatReference(reference: string, path: string): string {
    const lookup = findReferenceValue(state, question, path);
    if (lookup.isFound)
      return formatReferenceValue(lookup.value);
    return reference;
  }
  return text.replace(REFERENCE_PATTERN, formatReference);
}
