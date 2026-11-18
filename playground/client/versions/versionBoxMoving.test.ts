import { test, expect, afterEach, describe, spyOn } from 'bun:test';
import type { EditorView } from '@codemirror/view';
import * as editors from '../editors/editors';
import * as graphs from '../graphs/graphs';
import * as winnersDom from '../runs/winnersDom';
import { pageState } from '../page/state';
import { getHardCodedQuestions } from '../../providers/typeSafeQuery';
import { moveByVersions, renderLastVersion, updateOnEditorChange } from './versionBox';
import { installFakeDom, installQuestionsStub, getIsoTime, createDefaultVersion, createVersion, removeFakeState } from './versionBoxFakeDom';

interface MovingRecorder {
    shownStates: unknown[];
    shownResults: unknown[];
    shownGraphOutputs: unknown[];
    filledTexts: string[];
    stateText: string;
}

function createMovingRecorder(stateText: string): MovingRecorder {
    return { shownStates: [], shownResults: [], shownGraphOutputs: [], filledTexts: [], stateText };
}

function storeShownState(recorder: MovingRecorder, value: unknown) {
    recorder.shownStates.push(value);
    recorder.stateText = JSON.stringify(value);
}

function storeShownResult(recorder: MovingRecorder, value: unknown) {
    recorder.shownResults.push(value);
}

function storeShownGraphOutputs(recorder: MovingRecorder, version: { outputs: unknown[] }) {
    recorder.shownGraphOutputs.push(version.outputs);
}

function storeFilledText(recorder: MovingRecorder, _editor: EditorView, text: string) {
    recorder.filledTexts.push(text);
}

function renderNothing() {}

function installMovingSpies(recorder: MovingRecorder) {
    spyOn(editors, 'renderStateJson').mockImplementation(storeShownState.bind(null, recorder));
    spyOn(editors, 'renderResultJson').mockImplementation(storeShownResult.bind(null, recorder));
    spyOn(graphs, 'renderGraphs').mockImplementation(storeShownGraphOutputs.bind(null, recorder) as never);
    spyOn(winnersDom, 'renderWinners').mockImplementation(renderNothing);
    spyOn(editors, 'getStateEditor').mockReturnValue({ state: { doc: { toString: () => recorder.stateText } } } as unknown as EditorView);
}

function installTwoVersionsAtLastIndex(recorder: MovingRecorder) {
    const elements = installFakeDom();
    installMovingSpies(recorder);
    const renderQuestionsSpy = installQuestionsStub('{}');
    pageState.versions = [createVersion(1, { a: 1 }), createVersion(2, { b: 2 })];
    pageState.index = 1;
    return { elements, renderQuestionsSpy };
}

function assertFirstVersionShown(recorder: MovingRecorder, elements: ReturnType<typeof installFakeDom>, renderQuestionsSpy: ReturnType<typeof installQuestionsStub>) {
    expect(pageState.index).toBe(0);
    expect(recorder.shownStates).toEqual([{ a: 1 }]);
    expect(renderQuestionsSpy.mock.calls).toEqual([[{}]]);
    expect(recorder.shownResults).toEqual([[]]);
    expect(recorder.shownGraphOutputs).toEqual([[]]);
    expect(elements.versionLabel.textContent).toBe(`version 1 of 2 · ${new Date(getIsoTime()).toLocaleString()} · 1 call`);
    expect(elements.tokensLabel.textContent).toBe('Tokens: 0');
    expect(pageState.isDirty).toBe(false);
}

function validateMovingWrapsAndRendersThatVersion() {
    const recorder = createMovingRecorder('{"b":2}');
    const { elements, renderQuestionsSpy } = installTwoVersionsAtLastIndex(recorder);
    moveByVersions(1);
    assertFirstVersionShown(recorder, elements, renderQuestionsSpy);
    moveByVersions(-1);
    expect(pageState.index).toBe(1);
    renderLastVersion();
    expect(pageState.index).toBe(1);
}

function installTwoDefaultVersionsAtFirstIndex(recorder: MovingRecorder) {
    const elements = installFakeDom();
    installMovingSpies(recorder);
    spyOn(editors, 'fillEditorText').mockImplementation(storeFilledText.bind(null, recorder));
    installQuestionsStub(JSON.stringify(getHardCodedQuestions()));
    pageState.versions = [createDefaultVersion(), { ...createDefaultVersion(), state: { b: 2 } }];
    pageState.index = 0;
    return elements;
}

function validateMovingAwayAndBackWithTwoVersionsKeepsTheOverwritingText() {
    const recorder = createMovingRecorder('{"a":1}');
    const elements = installTwoDefaultVersionsAtFirstIndex(recorder);
    updateOnEditorChange({ docChanged: true, transactions: [] } as never);
    expect(elements.versionLabel.textContent).toBe('version 1 of 2 · not run yet · 0 calls');
    moveByVersions(-1);
    expect(pageState.index).toBe(1);
    expect(recorder.stateText).toBe('{"b":2}');
    moveByVersions(1);
    expect(pageState.index).toBe(0);
    expect(recorder.filledTexts[0]).toBe('{"a":1}');
}

function registerMovingTests() {
    afterEach(removeFakeState);
    test('test_moving_away_and_back_with_two_versions_keeps_the_overwriting_text', validateMovingAwayAndBackWithTwoVersionsKeepsTheOverwritingText);
    test('test_moving_wraps_and_renders_that_version', validateMovingWrapsAndRendersThatVersion);
}

describe('versionBox moving', registerMovingTests);
