import type { Version } from '../../history/playgroundHistory';
import { pageState } from '../page/state';
import { getOutput } from './submitBatchHarnessShapes';
import type { FetchBody, Harness, RunSnapshot } from './submitBatchHarnessShapes';

function executeOpenRoute(harness: Harness, body: FetchBody): Response {
    harness.openBodies.push(body.versions);
    harness.history = JSON.parse(JSON.stringify(body.versions));
    return Response.json({ versions: harness.history });
}

function executeNoteRoute(harness: Harness, body: FetchBody): Response {
    harness.notes.push({ index: body.index, body });
    harness.history[body.index].questionsNote = body.questionsNote;
    return Response.json(harness.history[body.index]);
}

function executeDraftRoute(harness: Harness, body: FetchBody): Response {
    harness.drafts.push(body);
    return new Response('ok');
}

function buildRunSnapshot(harness: Harness, body: FetchBody): RunSnapshot {
    const { submitButton, batchCheckbox, newButton } = harness.elements;
    return {
        index: body.index, calls: body.calls, state: body.state, questions: body.questions,
        buttonText: submitButton.textContent, isButtonDisabled: submitButton.disabled,
        isToggleDisabled: batchCheckbox.disabled, isNewDisabled: newButton.disabled,
        areEditorsLocked: harness.locks[harness.locks.length - 1] === true, shownIndex: pageState.index,
    };
}

function appendRunOutputs(version: Version, callCount: number): void {
    for (let i = 0; i < callCount; i++)
        version.outputs.push(getOutput() as never);
    version.calls += callCount;
    version.time = new Date().toISOString();
}

function executeRunRoute(harness: Harness, failingIndexes: number[], body: FetchBody): Response {
    harness.runs.push(buildRunSnapshot(harness, body));
    const isFailingIndex = failingIndexes.includes(body.index);
    if (isFailingIndex)
        return new Response('boom', { status: 500 });
    const version = harness.history[body.index];
    appendRunOutputs(version, body.calls);
    return Response.json({ outputs: [], version, index: body.index });
}

async function executeFetch(harness: Harness, failingIndexes: number[], path: string | URL | Request, init?: RequestInit): Promise<Response> {
    const route = String(path);
    harness.fetchOrder.push(route);
    const body = JSON.parse(String(init?.body)) as FetchBody;
    if (route === '/open')
        return executeOpenRoute(harness, body);
    if (route === '/note')
        return executeNoteRoute(harness, body);
    if (route === '/draft')
        return executeDraftRoute(harness, body);
    return executeRunRoute(harness, failingIndexes, body);
}

export function createStubFetch(harness: Harness, failingIndexes: number[]): typeof fetch {
    return ((path: string | URL | Request, init?: RequestInit) => executeFetch(harness, failingIndexes, path, init)) as unknown as typeof fetch;
}
