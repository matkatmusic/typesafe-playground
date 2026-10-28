import type { Version } from '../playgroundHistory';
import { getStateEditor } from './editors';
import { getShownVersion } from './state';
import { isJsonTextEdited } from './versionLabel';

export type NoteKind = 'state';

function readStateText(): string {
  return getStateEditor().state.doc.toString();
}

function getStateValue(version: Version): unknown {
  return version.state;
}

const KIND_SOURCES = { state: { readText: readStateText, getValue: getStateValue } };

export function isKindTextEdited(kind: NoteKind): boolean {
  const source = KIND_SOURCES[kind];
  return isJsonTextEdited(source.readText(), source.getValue(getShownVersion()));
}
