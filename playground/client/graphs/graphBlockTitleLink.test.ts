import { test, expect, spyOn } from 'bun:test';
import { json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import type { TransactionSpec } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import * as editors from '../editors/editors';
import { createGraphBlock } from './graphBlock';
import { executeNothing, getVersion, installFakeDocument, removeFakeDocument } from './graphBlockFakeDom';
import type { FakeElement } from './graphBlockFakeDom';

function readTitleParts(): FakeElement[] {
    installFakeDocument();
    const question = { type: 'noul', instructions: 'Does `message.text` ask?' } as const;
    const graphBlock = createGraphBlock(1, 'q', question, executeNothing, { ...getVersion(), state: { message: { text: 'Hi.' } } });
    const block = graphBlock.block as unknown as FakeElement;
    const titleRow = block.children[0] as FakeElement;
    return (titleRow.children[1] as FakeElement).children as FakeElement[];
}

function createQuestionsEditorStub(doc: string, dispatchedEffects: { from: number; y: string }[]): EditorView {
    const state = EditorState.create({ doc: doc, extensions: [json()] });
    function saveDispatch(spec: TransactionSpec): void {
        for (const effect of state.update(spec).effects) {
            const target = effect.value as { range: { from: number }; y: string };
            dispatchedEffects.push({ from: target.range.from, y: target.y });
        }
    }
    return { state: state, dispatch: saveDispatch } as unknown as EditorView;
}

function validateTitleLinkMovesTheQuestionsEditorToTheGraphsQuestion() {
    const parts = readTitleParts();
    expect(parts[0].className).toBe('graph-question-link');
    expect(parts[0].textContent).toBe('Q1 q');
    const doc = '{\n  "p": {},\n  "q": {}\n}';
    const dispatchedEffects: { from: number; y: string }[] = [];
    spyOn(editors, 'getQuestionsEditor').mockReturnValue(createQuestionsEditorStub(doc, dispatchedEffects));
    parts[0].listeners.click();
    expect(dispatchedEffects).toEqual([{ from: doc.indexOf('"q"'), y: 'start' }]);
    removeFakeDocument();
}

function createOwnNameQuestion() {
    return { type: 'noul', instructions: { task: 'Is `secretWord` the word banana?', secretWord: 'banana' } } as const;
}

function createCrossNameQuestion() {
    return { type: 'noul', instructions: 'Is `secretWord` the word banana?' } as const;
}

function listTitleClasses(name: string, question: ReturnType<typeof createOwnNameQuestion> | ReturnType<typeof createCrossNameQuestion>): string[] {
    installFakeDocument();
    const scopeVersion = { ...getVersion(), state: { fruit: 'apple' }, questions: { ownName: createOwnNameQuestion(), crossName: createCrossNameQuestion() } };
    const graphBlock = createGraphBlock(1, name, question, executeNothing, scopeVersion);
    const titleRow = (graphBlock.block as unknown as FakeElement).children[0] as FakeElement;
    const titleParts = (titleRow.children[1] as FakeElement).children as FakeElement[];
    const classNames: string[] = [];
    for (const part of titleParts)
        classNames.push(part.className);
    return classNames;
}

function validateCrossNameTitleGetsNoHoverTextFromAnotherQuestion() {
    // Step: crossName uses secretWord but only ownName declares it.
    const classes = listTitleClasses('crossName', createCrossNameQuestion());
    // Step: the title holds no hover-text span.
    expect(classes).not.toContain('backtick-ref');
    removeFakeDocument();
}

function validateOwnNameTitleGetsHoverTextFromItsOwnQuestion() {
    // Step: ownName declares secretWord in its own instructions.
    const classes = listTitleClasses('ownName', createOwnNameQuestion());
    // Step: the title holds a hover-text span.
    expect(classes).toContain('backtick-ref');
    removeFakeDocument();
}

test('test_cross_name_title_gets_no_hover_text_from_another_question', validateCrossNameTitleGetsNoHoverTextFromAnotherQuestion);
test('test_own_name_title_gets_hover_text_from_its_own_question', validateOwnNameTitleGetsHoverTextFromItsOwnQuestion);
test('test_title_link_moves_the_questions_editor_to_the_graphs_question', validateTitleLinkMovesTheQuestionsEditorToTheGraphsQuestion);
