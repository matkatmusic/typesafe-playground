import { describe, test, expect, afterEach } from 'bun:test';
import { pageState } from '../page/state';
import { executeSubmit } from '../runs/submit';
import { moveToPreviousVersion } from './versionBox';
import { buildVersion, installOneVersionWithAnEditedState, removeFakeState } from './editedVersionStopSetup';

async function validateARunClearsTheKeptDraft() {
    const { elements } = installOneVersionWithAnEditedState();
    moveToPreviousVersion();
    expect(pageState.editedDraft).toEqual({ state: '{"a": 2}', questions: '{"q": {"type": "noul"}}', baseIndex: 0 });
    async function fetchRunResult() {
        return Response.json({ outputs: [], version: buildVersion(), index: 1 });
    }
    globalThis.fetch = fetchRunResult as unknown as typeof fetch;
    await executeSubmit();
    expect(pageState.editedDraft).toBeNull();
    expect(pageState.versions.length).toBe(2);
    expect(elements.errorLine.textContent).toBe('');
}

function registerEditedVersionStopRunTests() {
    afterEach(removeFakeState);
    test('test_a_run_clears_the_kept_draft', validateARunClearsTheKeptDraft);
}

describe('editedVersionStopRun', registerEditedVersionStopRunTests);
