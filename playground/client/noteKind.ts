import type { Version } from '../playgroundHistory';
import { getQuestionsEditor, getStateEditor } from './editors';
import { getShownVersion } from './state';
import { isJsonTextEdited } from './versionLabel';

export type NoteKind = 'state' | 'questions';

function readStateText(): string {
  return getStateEditor().state.doc.toString();
}

function getStateValue(version: Version): unknown {
  return version.state;
}

function readQuestionsText(): string {
  return getQuestionsEditor().state.doc.toString();
}

function getQuestionsValue(version: Version): unknown {
  return version.questions;
}

const KIND_SOURCES = {
  state: { readText: readStateText, getValue: getStateValue },
  questions: { readText: readQuestionsText, getValue: getQuestionsValue },
};

export function isKindTextEdited(kind: NoteKind): boolean {
  const source = KIND_SOURCES[kind];
  return isJsonTextEdited(source.readText(), source.getValue(getShownVersion()));
}
