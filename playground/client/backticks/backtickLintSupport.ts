import { json } from '@codemirror/lang-json';
import type { Diagnostic } from '@codemirror/lint';
import { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { buildUndefinedNameSource } from './backtickLint';
import { getQuestionsEditorFacet } from '../questions/questionNames';

export function getFruitState(): string {
    return '{"fruit": "apple"}';
}

export function getScopeQuestions(): string {
    return '{"ownName":{"type":"noul","instructions":{"task":"Is `secretWord` the word banana?","secretWord":"banana"}},"crossName":{"type":"noul","instructions":"Is `secretWord` the word banana?"},"stateName":{"type":"noul","instructions":"Is `fruit` the word apple?"}}';
}

export function createJsonState(text: string): EditorState {
    return EditorState.create({ doc: text, extensions: [json()] });
}

export function createQuestionsState(text: string): EditorState {
    return EditorState.create({ doc: text, extensions: [json(), getQuestionsEditorFacet().of(true)] });
}

export function collectQuestionsEditorDiagnostics(stateText: string, questionsText: string): Diagnostic[] {
    const questionsState = createQuestionsState(questionsText);
    function getEditorStates() {
        return [createJsonState(stateText), questionsState];
    }
    const source = buildUndefinedNameSource(getEditorStates);
    return source({ state: questionsState } as unknown as EditorView) as Diagnostic[];
}
