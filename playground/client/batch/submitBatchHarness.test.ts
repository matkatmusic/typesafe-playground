import { spyOn, mock } from 'bun:test';
import type { EditorView } from '@codemirror/view';
import type { Questions } from '@typesafe-ai/sdk';
import type { Version } from '../../history/playgroundHistory';
import * as editors from '../editors/editors';
import * as graphs from '../graphs/graphs';
import * as winnersDom from '../runs/winnersDom';
import { pageState } from '../page/state';
import { createElements, installDocumentGlobals } from './submitBatchHarnessElements';
import { createStubFetch } from './submitBatchHarnessFetch';
import { getOutput } from './submitBatchHarnessShapes';
import type { Harness } from './submitBatchHarnessShapes';

export type { Harness };

class FetchKeeper {
    private static readonly instance = new FetchKeeper();
    public readonly realFetch = globalThis.fetch;
    private constructor() {}
    public static getInstance(): FetchKeeper {
        return FetchKeeper.instance;
    }
}

export function getQuestions(): Questions {
    return { q: { type: 'noul', instructions: 'x' } } as unknown as Questions;
}

export function buildVersion(state: unknown, questions: unknown, outputCount: number, time: string): Version {
    const outputs = [];
    for (let i = 0; i < outputCount; i++)
        outputs.push(getOutput());
    return { time, state, questions, calls: outputCount, outputs } as unknown as Version;
}

function createHarness(elements: Harness['elements'], stateText: string, questionsText: string): Harness {
    return { elements, history: [], runs: [], notes: [], drafts: [], alerts: [], openBodies: [], locks: [], stateText: { value: stateText }, questionsText: { value: questionsText }, fetchOrder: [] };
}

function buildStubEditor(text: { value: string }): EditorView {
    return { state: { doc: { toString: () => text.value } }, dispatch: renderNothing } as unknown as EditorView;
}

function renderNothing(): void {}

function createStateRenderer(harness: Harness) {
    return (value: unknown) => {
        harness.stateText.value = JSON.stringify(value);
    };
}

function createQuestionsRenderer(harness: Harness) {
    return (value: unknown) => {
        harness.questionsText.value = JSON.stringify(value);
    };
}

function createLockRecorder(harness: Harness) {
    return (_editor: EditorView, isLocked: boolean) => {
        harness.locks.push(isLocked);
    };
}

function createAlertRecorder(harness: Harness) {
    return (message: string) => harness.alerts.push(message);
}

function installEditorSpies(harness: Harness): void {
    spyOn(editors, 'getStateEditor').mockReturnValue(buildStubEditor(harness.stateText));
    spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildStubEditor(harness.questionsText));
    spyOn(editors, 'renderStateJson').mockImplementation(createStateRenderer(harness));
    spyOn(editors, 'renderQuestionsJson').mockImplementation(createQuestionsRenderer(harness));
    spyOn(editors, 'renderResultJson').mockImplementation(renderNothing);
    spyOn(editors, 'setEditorLocked').mockImplementation(createLockRecorder(harness));
}

function installRenderSpies(): void {
    spyOn(graphs, 'renderGraphs').mockImplementation(renderNothing);
    spyOn(winnersDom, 'renderWinners').mockImplementation(renderNothing);
}

export function installHarness(initial: Version[], shownIndex: number, stateText: string, questionsText: string, failingIndexes: number[], hasEnvKey = true): Harness {
    const elements = createElements(hasEnvKey);
    installDocumentGlobals(elements);
    const harness = createHarness(elements, stateText, questionsText);
    installEditorSpies(harness);
    installRenderSpies();
    Object.assign(globalThis, { alert: createAlertRecorder(harness) });
    harness.history = JSON.parse(JSON.stringify(initial));
    pageState.versions = initial;
    pageState.index = shownIndex;
    globalThis.fetch = createStubFetch(harness, failingIndexes);
    return harness;
}

export function resetHarness() {
    mock.restore();
    for (const name of ['document', 'HTMLButtonElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'alert'])
        Reflect.deleteProperty(globalThis, name);
    globalThis.fetch = FetchKeeper.getInstance().realFetch;
    pageState.versions = [];
    pageState.index = 0;
    pageState.isDirty = false;
    pageState.isBatchOn = false;
    pageState.batchRun = null;
    pageState.editedDraft = null;
    pageState.pendingNotes = { state: null, questions: null };
}

export function enableBatch() {
    pageState.isBatchOn = true;
}
