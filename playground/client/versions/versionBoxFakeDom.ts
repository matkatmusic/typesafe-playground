import { mock, spyOn } from 'bun:test';
import type { EditorView } from '@codemirror/view';
import * as editors from '../editors/editors';
import * as noteBox from '../notes/noteBox';
import * as pinButtons from '../pins/pinButtons';
import { pageState } from '../page/state';
import { getHardCodedQuestions, getHardCodedState } from '../../providers/typeSafeQuery';
import * as versionArrows from './versionArrows';

export function getIsoTime() {
    return '2026-03-04T05:06:07.000Z';
}

function executeNoOp() {}

export function installFakeDom() {
    const elements: Record<string, { textContent: string }> = {
        versionLabel: { textContent: '' }, costLabel: { textContent: '' }, totalCostLabel: { textContent: '' }, tokensLabel: { textContent: '' }, lastEditedLabel: { textContent: '' },
        graphContainerBox: { textContent: '' }, winnerBox: { textContent: '' },
    };
    spyOn(versionArrows, 'updateVersionArrows').mockImplementation(executeNoOp);
    spyOn(pinButtons, 'applyPinButtons').mockImplementation(executeNoOp);
    spyOn(noteBox, 'applyNoteBox').mockImplementation(executeNoOp);
    Object.assign(globalThis, { document: { getElementById: (id: string) => elements[id] ?? null } });
    return elements;
}

export function buildStubStateEditor(text: string) {
    return { state: { doc: { toString: () => text } } } as unknown as EditorView;
}

export function createVersion(id: number, state: unknown) {
    return { id: id, time: getIsoTime(), state: state as never, questions: {}, calls: id, outputs: [] };
}

export function createDefaultVersion() {
    return { time: getIsoTime(), state: getHardCodedState(), questions: getHardCodedQuestions(), calls: 0, outputs: [] };
}

export function installQuestionsStub(questionsText: string) {
    spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildStubStateEditor(questionsText));
    return spyOn(editors, 'renderQuestionsJson').mockImplementation(executeNoOp);
}

export function removeFakeState() {
    mock.restore();
    Reflect.deleteProperty(globalThis, 'document');
    Reflect.deleteProperty(globalThis, 'Element');
    pageState.versions = [];
    pageState.index = 0;
    pageState.isDirty = false;
    pageState.editedDraft = null;
}
