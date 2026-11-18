import type { Version } from '../../history/playgroundHistory';
import { getQuestionsEditor, getStateEditor } from '../editors/editors';
import { getShownVersion } from '../page/state';
import { isJsonTextEdited } from '../versions/versionLabel';

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

function getKindSources() {
    return {
        state: { readText: readStateText, getValue: getStateValue },
        questions: { readText: readQuestionsText, getValue: getQuestionsValue },
    };
}

export function isKindTextEdited(kind: NoteKind): boolean {
    const source = getKindSources()[kind];
    return isJsonTextEdited(source.readText(), source.getValue(getShownVersion()));
}
