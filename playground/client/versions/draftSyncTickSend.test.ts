import { test, expect, afterEach, describe } from 'bun:test';
import { sendDraft, launchDraftSession, syncDraftOnTick } from './draftSync';
import { pageState } from '../page/state';
import { getSessionId, removeFakeState, installStubEditors, installFakeSessionStorage, installFetchRecorder, installStubSetInterval } from './draftSyncFakes';

async function launchSessionAndClearRecorder(stateText: string) {
    const editors = installStubEditors(stateText, 'q');
    installFakeSessionStorage({ playgroundSessionId: getSessionId() });
    const seen = installFetchRecorder(null);
    installStubSetInterval();
    await launchDraftSession();
    seen.length = 0;
    return { stateTexts: editors.stateTexts, seen };
}

async function validateTickSendsOnlyWhenEditorTextChangedSinceTheLastSend() {
    const { stateTexts, seen } = await launchSessionAndClearRecorder('s');
    syncDraftOnTick();
    expect(seen).toEqual([]);
    stateTexts.value = '{"a": ';
    syncDraftOnTick();
    await sendDraft();
    expect(seen[0]).toEqual({ path: '/draft', method: 'POST', body: { id: getSessionId(), state: '{"a": ', questions: 'q', isBatch: false } });
    const sentCount = seen.length;
    syncDraftOnTick();
    expect(seen.length).toBe(sentCount);
}

async function validateSendDraftPostsInOrder() {
    const { seen } = await launchSessionAndClearRecorder('s');
    void sendDraft();
    await sendDraft();
    expect(seen.length).toBe(2);
}

async function validateBatchToggleIsSentWithTheDraftAndTriggersTheNextTick() {
    // Step: the draft session starts with batch off and nothing to send.
    const { seen } = await launchSessionAndClearRecorder('[{"a": 1}]');
    syncDraftOnTick();
    expect(seen).toEqual([]);
    // Step: turning batch on sends the draft with isBatch true, though the text did not change.
    pageState.isBatchOn = true;
    syncDraftOnTick();
    await sendDraft();
    expect(seen[0].body).toEqual({ id: getSessionId(), state: '[{"a": 1}]', questions: 'q', isBatch: true });
    const sentCount = seen.length;
    syncDraftOnTick();
    expect(seen.length).toBe(sentCount);
    pageState.isBatchOn = false;
}

function registerDraftSyncTickSendTests() {
    afterEach(removeFakeState);
    test('test_batch_toggle_is_sent_with_the_draft_and_triggers_the_next_tick', validateBatchToggleIsSentWithTheDraftAndTriggersTheNextTick);
    test('test_tick_sends_only_when_editor_text_changed_since_the_last_send', validateTickSendsOnlyWhenEditorTextChangedSinceTheLastSend);
    test('test_send_draft_posts_in_order', validateSendDraftPostsInOrder);
}

describe('draftSync tick send', registerDraftSyncTickSendTests);
