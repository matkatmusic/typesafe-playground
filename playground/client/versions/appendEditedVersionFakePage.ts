import { mock, spyOn } from 'bun:test';
import type { EditorView } from '@codemirror/view';
import type { Questions } from '@typesafe-ai/sdk';
import * as costTokens from '../runs/costTokens';
import * as editors from '../editors/editors';
import * as graphs from '../graphs/graphs';
import * as noteBox from '../notes/noteBox';
import * as pinButtons from '../pins/pinButtons';
import { pageState } from '../page/state';
import * as versionArrows from './versionArrows';
import * as versionBox from './versionBox';
import * as winnersDom from '../runs/winnersDom';

export function resetFakePage() {
    mock.restore();
    Reflect.deleteProperty(globalThis, 'document');
    pageState.versions = [];
    pageState.index = 0;
}

export function buildVersion() {
    return { time: 't', state: { a: 1 }, questions: { q: 1 } as unknown as Questions, calls: 2, outputs: [], note: 'old note' };
}

function applyNoop() {}

function buildEditorStub(text: string) {
    return { state: { doc: { toString: () => text } } } as unknown as EditorView;
}

function installEditorStubs(stateText: string, questionsText: string) {
    spyOn(editors, 'getStateEditor').mockReturnValue(buildEditorStub(stateText));
    spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildEditorStub(questionsText));
}

function installRenderSpies() {
    return {
        note: spyOn(noteBox, 'applyNoteBox').mockImplementation(applyNoop),
        cost: spyOn(costTokens, 'renderCostAndTokens').mockImplementation(applyNoop),
        result: spyOn(editors, 'renderResultJson').mockImplementation(applyNoop),
        graphs: spyOn(graphs, 'renderGraphs').mockImplementation(applyNoop),
        winners: spyOn(winnersDom, 'renderWinners').mockImplementation(applyNoop),
        stateFill: spyOn(editors, 'renderStateJson').mockImplementation(applyNoop),
        questionsFill: spyOn(editors, 'renderQuestionsJson').mockImplementation(applyNoop),
    };
}

export function installPage(stateText: string, questionsText: string) {
    pageState.versions = [buildVersion()];
    pageState.index = 0;
    installEditorStubs(stateText, questionsText);
    const errorLine = { textContent: '' };
    Object.assign(globalThis, { document: { getElementById: () => errorLine } });
    const refreshSpy = spyOn(versionBox, 'refreshVersionBox').mockImplementation(applyNoop);
    const arrowsSpy = spyOn(versionArrows, 'updateVersionArrows').mockImplementation(applyNoop);
    const pinSpy = spyOn(pinButtons, 'applyPinButtons').mockImplementation(applyNoop);
    const renderSpies = installRenderSpies();
    return { errorLine, refreshSpy, arrowsSpy, pinSpy, renderSpies };
}

export function installOpenFetch() {
    const seen: { path: string; body: { versions: unknown[] } }[] = [];
    async function fetchStubbedResponse(path: string | URL | Request, init?: RequestInit) {
        const body = JSON.parse(String(init?.body));
        seen.push({ path: String(path), body: body });
        return Response.json({ versions: body.versions });
    }
    spyOn(globalThis, 'fetch').mockImplementation(fetchStubbedResponse as typeof fetch);
    return seen;
}
