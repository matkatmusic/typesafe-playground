import type { Version } from '../playgroundHistory';

type Container = Record<string, unknown>;

function isPlainObject(value: unknown): boolean {
  const isObject = typeof value === 'object' && value !== null;
  return isObject && !Array.isArray(value);
}

function joinKeyPath(path: string, key: string, isIndex: boolean): string {
  if (isIndex)
    return `${path}[${key}]`;
  return path === '' ? key : `${path}.${key}`;
}

function listEntryKeys(before: Container, after: Container): string[] {
  const keys = Object.keys(before);
  for (const key of Object.keys(after)) {
    const isNew = !keys.includes(key);
    if (isNew)
      keys.push(key);
  }
  return keys;
}

function collectEntryChanges(before: Container, after: Container, path: string, isIndex: boolean, changes: string[]): void {
  for (const key of listEntryKeys(before, after)) {
    const entryPath = joinKeyPath(path, key, isIndex);
    const isAdded = !(key in before);
    const isRemoved = !(key in after);
    if (isAdded)
      changes.push(`\`${entryPath}\` added`);
    else if (isRemoved)
      changes.push(`\`${entryPath}\` removed`);
    else
      collectChanges(before[key], after[key], entryPath, changes);
  }
}

function collectChanges(before: unknown, after: unknown, path: string, changes: string[]): void {
  const areObjects = isPlainObject(before) && isPlainObject(after);
  const areArrays = Array.isArray(before) && Array.isArray(after);
  const areContainers = areObjects || areArrays;
  if (areContainers) {
    collectEntryChanges(before as Container, after as Container, path, areArrays, changes);
    return;
  }
  const isSame = JSON.stringify(before) === JSON.stringify(after);
  if (!isSame)
    changes.push(`\`${path}\` changed`);
}

function listLabeledBullets(label: string, before: unknown, after: unknown): string[] {
  const changes: string[] = [];
  collectChanges(before, after, '', changes);
  const bullets: string[] = [];
  for (const change of changes)
    bullets.push(`- ${label}: ${change}`);
  return bullets;
}

export function listChangeBlocks(version: Version, previous: Version | undefined): string[] {
  if (previous === undefined)
    return [];
  const bullets = [
    ...listLabeledBullets('state', previous.state, version.state),
    ...listLabeledBullets('questions', previous.questions, version.questions),
  ];
  const hasBullets = bullets.length > 0;
  if (!hasBullets)
    return [];
  return ['### Changes', bullets.join('\n')];
}
