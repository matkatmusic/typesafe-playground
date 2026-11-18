import { test, expect, afterEach, describe, mock, spyOn } from 'bun:test';
import type { EditorView } from '@codemirror/view';
import * as editors from '../editors/editors';
import * as graphs from '../graphs/graphs';
import * as noteBox from '../notes/noteBox';
import * as pinButtons from '../pins/pinButtons';
import * as winnersDom from '../runs/winnersDom';
import { pageState } from '../page/state';
import * as versionArrows from './versionArrows';
import { moveOnArrowKey } from './versionBox';

function findStubClosest(this: StubElement) {
    return this.isInside ? this : null;
}

class StubElement {
    public readonly closest = findStubClosest;
    public constructor(public readonly isInside: boolean) {}
}

function executeNoOp() {}

function getFakeElementById(id: string) {
    const elements: Record<string, { textContent: string }> = {
        versionLabel: { textContent: '' }, costLabel: { textContent: '' }, totalCostLabel: { textContent: '' }, tokensLabel: { textContent: '' }, lastEditedLabel: { textContent: '' },
        graphContainerBox: { textContent: '' }, winnerBox: { textContent: '' },
    };
    return elements[id] ?? null;
}

function installFakeDom() {
    spyOn(versionArrows, 'updateVersionArrows').mockImplementation(executeNoOp);
    spyOn(pinButtons, 'applyPinButtons').mockImplementation(executeNoOp);
    spyOn(noteBox, 'applyNoteBox').mockImplementation(executeNoOp);
    Object.assign(globalThis, { document: { getElementById: getFakeElementById } });
}

function buildStubStateEditor(text: string) {
    const stubDoc = { toString: () => text };
    return { state: { doc: stubDoc } } as unknown as EditorView;
}

function buildVersion(id: number, state: unknown) {
    return { id: id, time: '2026-03-04T05:06:07.000Z', state: state as never, questions: {}, calls: id, outputs: [] };
}

function removeFakeState() {
    mock.restore();
    Reflect.deleteProperty(globalThis, 'document');
    Reflect.deleteProperty(globalThis, 'Element');
    pageState.versions = [];
    pageState.index = 0;
    pageState.isDirty = false;
}

function installFakeEditorsAndRenderers() {
    spyOn(editors, 'renderStateJson').mockImplementation(executeNoOp);
    spyOn(editors, 'renderResultJson').mockImplementation(executeNoOp);
    spyOn(graphs, 'renderGraphs').mockImplementation(executeNoOp);
    spyOn(winnersDom, 'renderWinners').mockImplementation(executeNoOp);
    spyOn(editors, 'getStateEditor').mockReturnValue(buildStubStateEditor('{"a":1}'));
    spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildStubStateEditor('{}'));
    spyOn(editors, 'renderQuestionsJson').mockImplementation(executeNoOp);
}

function validateArrowKeyMovesOnlyOutsideTypingTargets() {
    installFakeDom();
    Object.assign(globalThis, { Element: StubElement });
    installFakeEditorsAndRenderers();
    pageState.versions = [buildVersion(1, { a: 1 }), buildVersion(2, { b: 2 })];
    pageState.index = 0;
    moveOnArrowKey({ key: 'ArrowRight', target: new StubElement(true) } as unknown as KeyboardEvent);
    expect(pageState.index).toBe(0);
    moveOnArrowKey({ key: 'ArrowUp', target: new StubElement(false) } as unknown as KeyboardEvent);
    expect(pageState.index).toBe(0);
    moveOnArrowKey({ key: 'ArrowRight', target: new StubElement(false) } as unknown as KeyboardEvent);
    expect(pageState.index).toBe(1);
}

function registerVersionBoxArrowKeyTests() {
    afterEach(removeFakeState);
    test('test_arrow_key_moves_only_outside_typing_targets', validateArrowKeyMovesOnlyOutsideTypingTargets);
}

describe('versionBox arrow keys', registerVersionBoxArrowKeyTests);
