import { test, expect, describe } from 'bun:test';
import type { Version } from '../../history/playgroundHistory';
import { createElements } from './submitBatchHarnessElements';
import { createStubFetch } from './submitBatchHarnessFetch';
import type { Harness } from './submitBatchHarnessShapes';

function buildHarness(history: Version[]): Harness {
    return { elements: createElements(false), history, runs: [], notes: [], drafts: [], alerts: [], openBodies: [], locks: [], stateText: { value: '' }, questionsText: { value: '' }, fetchOrder: [] };
}

function buildEmptyVersion(): Version {
    return { time: 't', state: {}, questions: {}, calls: 0, outputs: [] } as unknown as Version;
}

async function validateOpenRouteCopiesVersionsIntoHistory() {
    const harness = buildHarness([]);
    const stubFetch = createStubFetch(harness, []);
    // Step: post two versions to the open route.
    const versions = [buildEmptyVersion(), buildEmptyVersion()];
    const response = await stubFetch('/open', { body: JSON.stringify({ versions }) });
    // Step: the history holds a deep copy, not the same objects.
    expect(harness.history).toEqual(versions);
    expect(harness.history[0]).not.toBe(versions[0]);
    expect(harness.openBodies.length).toBe(1);
    expect((await response.json()).versions).toEqual(versions);
}

async function validateNoteRouteStoresNoteOnVersion() {
    const harness = buildHarness([buildEmptyVersion()]);
    const stubFetch = createStubFetch(harness, []);
    // Step: post a note for version 0.
    await stubFetch('/note', { body: JSON.stringify({ index: 0, questionsNote: 'hello' }) });
    // Step: the version holds the note and the note list has one entry.
    expect(harness.history[0].questionsNote).toBe('hello' as never);
    expect(harness.notes.length).toBe(1);
    expect(harness.notes[0].index).toBe(0);
}

async function validateDraftRouteRecordsBodyAndAnswersOk() {
    const harness = buildHarness([]);
    const stubFetch = createStubFetch(harness, []);
    // Step: post a draft.
    const response = await stubFetch('/draft', { body: JSON.stringify({ index: 0, text: 'draft' }) });
    // Step: the draft list holds the body and the answer is ok.
    expect(harness.drafts.length).toBe(1);
    expect(harness.drafts[0].text).toBe('draft');
    expect(await response.text()).toBe('ok');
}

async function validateRunRouteAddsOutputsAndRecordsSnapshot() {
    const harness = buildHarness([buildEmptyVersion()]);
    const stubFetch = createStubFetch(harness, []);
    // Step: post a run of 3 calls for version 0.
    const response = await stubFetch('/run', { body: JSON.stringify({ index: 0, calls: 3, state: { a: 1 }, questions: {} }) });
    // Step: the version gains 3 outputs and 3 calls.
    expect(harness.history[0].outputs.length).toBe(3);
    expect(harness.history[0].calls).toBe(3);
    // Step: one snapshot records the request.
    expect(harness.runs.length).toBe(1);
    expect(harness.runs[0].calls).toBe(3);
    expect((await response.json()).index).toBe(0);
}

async function validateRunRouteFailsForFailingIndex() {
    const harness = buildHarness([buildEmptyVersion()]);
    const stubFetch = createStubFetch(harness, [0]);
    // Step: post a run for the failing index.
    const response = await stubFetch('/run', { body: JSON.stringify({ index: 0, calls: 3, state: {}, questions: {} }) });
    // Step: the answer is 500 and the version is unchanged.
    expect(response.status).toBe(500);
    expect(harness.history[0].outputs.length).toBe(0);
}

async function validateRequestPathsAreRecordedInOrder() {
    const harness = buildHarness([buildEmptyVersion()]);
    const stubFetch = createStubFetch(harness, []);
    // Step: send a draft request, then a run request.
    await stubFetch('/draft', { body: '{}' });
    await stubFetch('/run', { body: JSON.stringify({ index: 0, calls: 1, state: {}, questions: {} }) });
    // Step: the order list holds both paths in send order.
    expect(harness.fetchOrder).toEqual(['/draft', '/run']);
}

function registerFetchTests() {
    test('open route copies the versions into the history', validateOpenRouteCopiesVersionsIntoHistory);
    test('note route stores the note on the version', validateNoteRouteStoresNoteOnVersion);
    test('draft route records the body and answers ok', validateDraftRouteRecordsBodyAndAnswersOk);
    test('run route adds outputs and records a snapshot', validateRunRouteAddsOutputsAndRecordsSnapshot);
    test('run route answers 500 for a failing index', validateRunRouteFailsForFailingIndex);
    test('request paths are recorded in order', validateRequestPathsAreRecordedInOrder);
}

describe('submit batch harness fetch', registerFetchTests);
