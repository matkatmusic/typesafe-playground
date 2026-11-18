import { basicSetup, EditorView } from 'codemirror';
import { indentWithTab } from '@codemirror/commands';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { syntaxHighlighting } from '@codemirror/language';
import { linter, lintGutter } from '@codemirror/lint';
import { Annotation, Compartment, EditorState, Transaction, type Extension } from '@codemirror/state';
import { keymap, type ViewUpdate } from '@codemirror/view';
import { createAddQuestion } from '../questions/addQuestion';
import { createBacktickKeyNames } from '../backticks/backtickCompletion';
import { findBacktickedKeys } from '../backticks/backtickKeys';
import { createBacktickHover } from '../backticks/backtickTooltip';
import { getElement } from '../page/dom';
import { findDuplicateKeys } from './duplicateKeys';
import { getJsonHighlight } from './editorHighlight';
import { createPlaceholders } from '../backticks/placeholders';
import { findQuestionsShapeErrors, findStateShapeErrors, getQuestionsEditorFacet } from '../questions/questionNames';
import { createPlaceholderTab } from '../backticks/placeholderTab';
import { clearQuestionsJsonError, clearStateJsonError } from './stateErrorClear';

export class EditorSingletons {
    private static instance: EditorSingletons | undefined;
    public readonly themeRules = {
        '&': { height: '100%', background: 'var(--panel)', color: 'var(--text)', border: '1px solid var(--grid)', borderRadius: '6px' },
        '.cm-scroller': { overflow: 'auto', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '13px' },
        '.cm-gutters': { background: 'var(--panel)', color: 'var(--text-muted)', border: 'none' },
    };
    public readonly fillAnnotation = Annotation.define<boolean>();
    public readonly lockCompartment = new Compartment();
    public readonly lockedExtensions: Extension[] = [EditorView.editable.of(false), EditorState.readOnly.of(true)];
    public resultEditor: EditorView | null = null;
    public stateEditor: EditorView | null = null;
    public questionsEditor: EditorView | null = null;
    private constructor() {}
    public static getInstance() {
        EditorSingletons.instance ??= new EditorSingletons();
        return EditorSingletons.instance;
    }
}

export function getFillAnnotation() {
    return EditorSingletons.getInstance().fillAnnotation;
}

export function buildResultExtensions(): Extension[] {
    return [
        basicSetup,
        json(),
        EditorView.lineWrapping,
        EditorView.theme(EditorSingletons.getInstance().themeRules),
        EditorState.readOnly.of(true),
    ];
}

export function buildJsonExtensions(): Extension[] {
    return [
        basicSetup,
        json(),
        EditorView.lineWrapping,
        syntaxHighlighting(getJsonHighlight()),
        EditorView.theme(EditorSingletons.getInstance().themeRules),
        linter(jsonParseLinter()), linter(findDuplicateKeys), linter(findBacktickedKeys), lintGutter(),
        createBacktickKeyNames(),
        createBacktickHover(),
        keymap.of([indentWithTab]),
        EditorSingletons.getInstance().lockCompartment.of([]),
    ];
}

export function formatResultJson(value: unknown): string {
    return JSON.stringify(value, null, 2);
}

export function createResultEditor(): EditorView {
    const singletons = EditorSingletons.getInstance();
    singletons.resultEditor = new EditorView({ doc: '{}', extensions: buildResultExtensions(), parent: getElement('resultJsonEditor') });
    return singletons.resultEditor;
}

export function getResultEditor(): EditorView {
    const { resultEditor } = EditorSingletons.getInstance();
    if (resultEditor === null)
        throw new Error('result editor is not created yet');
    return resultEditor;
}

function buildInputEditor(parentId: string, clearError: (update: ViewUpdate) => void, onEditorChange: (update: ViewUpdate) => void, extraExtensions: Extension[]): EditorView {
    const extensions = [buildJsonExtensions(), EditorView.updateListener.of(clearError), EditorView.updateListener.of(onEditorChange), extraExtensions];
    return new EditorView({ doc: '', extensions: extensions, parent: getElement(parentId) });
}

export function createStateEditor(onEditorChange: (update: ViewUpdate) => void): EditorView {
    const singletons = EditorSingletons.getInstance();
    singletons.stateEditor = buildInputEditor('stateJsonEditor', clearStateJsonError, onEditorChange, [linter(findStateShapeErrors)]);
    return singletons.stateEditor;
}

export function getStateEditor(): EditorView {
    const { stateEditor } = EditorSingletons.getInstance();
    if (stateEditor === null)
        throw new Error('state editor is not created yet');
    return stateEditor;
}

export function createQuestionsEditor(onEditorChange: (update: ViewUpdate) => void): EditorView {
    const singletons = EditorSingletons.getInstance();
    singletons.questionsEditor = buildInputEditor('questionsJsonEditor', clearQuestionsJsonError, onEditorChange, [createAddQuestion(), createPlaceholders(), createPlaceholderTab(), getQuestionsEditorFacet().of(true), linter(findQuestionsShapeErrors)]);
    return singletons.questionsEditor;
}

export function getQuestionsEditor(): EditorView {
    const { questionsEditor } = EditorSingletons.getInstance();
    if (questionsEditor === null)
        throw new Error('questions editor is not created yet');
    return questionsEditor;
}

export function replaceEditorText(editor: EditorView, text: string): void {
    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: text }, annotations: getFillAnnotation().of(true) });
}

export function fillEditorText(editor: EditorView, text: string): void {
    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: text }, annotations: [getFillAnnotation().of(true),Transaction.addToHistory.of(false)] });
}

export function setEditorLocked(editor: EditorView, isLocked: boolean): void {
    const { lockCompartment, lockedExtensions } = EditorSingletons.getInstance();
    editor.dispatch({ effects: lockCompartment.reconfigure(isLocked ? lockedExtensions : []), annotations: getFillAnnotation().of(true) });
}

export function renderResultJson(value: unknown): void {
    replaceEditorText(getResultEditor(), formatResultJson(value));
}

export function renderStateJson(value: unknown): void {
    fillEditorText(getStateEditor(), formatResultJson(value));
}

export function renderQuestionsJson(value: unknown): void {
    fillEditorText(getQuestionsEditor(), formatResultJson(value));
}
