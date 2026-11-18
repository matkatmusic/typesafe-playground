import { describe, test, expect, afterEach, spyOn, mock } from 'bun:test';
import type { EditorView } from '@codemirror/view';
import * as editors from '../editors/editors';
import * as graphs from '../graphs/graphs';
import * as winnersDom from './winnersDom';
import { pageState } from '../page/state';
import { executeSubmit, listLockableEditors, setEditorsLocked } from './submit';
import { getVersion, buildStubStateEditor, installFakeDom, removeFakeDom } from './submitFakeDom';

function writeNothing() {}

function installRenderSpies() {
    spyOn(editors, 'renderStateJson').mockImplementation(writeNothing);
    spyOn(editors, 'renderQuestionsJson').mockImplementation(writeNothing);
    spyOn(editors, 'renderResultJson').mockImplementation(writeNothing);
    spyOn(graphs, 'renderGraphs').mockImplementation(writeNothing);
    spyOn(winnersDom, 'renderWinners').mockImplementation(writeNothing);
}

function installLockSpies() {
    const lockCalls: boolean[] = [];
    const lockedEditors: EditorView[] = [];
    function saveLockCall(editor: EditorView, isLocked: boolean) {
        lockCalls.push(isLocked);
        lockedEditors.push(editor);
    }
    const stateEditor = buildStubStateEditor('{"a":1}');
    const questionsEditor = buildStubStateEditor('{"q":{"type":"noul"}}');
    spyOn(editors, 'setEditorLocked').mockImplementation(saveLockCall);
    spyOn(editors, 'getStateEditor').mockReturnValue(stateEditor);
    spyOn(editors, 'getQuestionsEditor').mockReturnValue(questionsEditor);
    installRenderSpies();
    return { lockCalls, lockedEditors, stateEditor, questionsEditor };
}

async function validateEditorsAreLockedWhileTheRunIsInFlightAndUnlockedAfterSuccess() {
    installFakeDom(true);
    const { lockCalls } = installLockSpies();
    pageState.versions = [getVersion()];
    let locksWhileRunning: boolean[] = [];
    async function fetchLockSnapshot() {
        locksWhileRunning = [...lockCalls];
        return Response.json({ outputs: [], version: { ...getVersion() }, index: 1 });
    }
    globalThis.fetch = fetchLockSnapshot as unknown as typeof fetch;
    await executeSubmit();
    mock.restore();
    expect(locksWhileRunning).toEqual([true, true]);
    expect(lockCalls).toEqual([true, true, false, false]);
}

async function validateEditorsAreUnlockedAfterAnErrorResponse() {
    installFakeDom(true);
    const { lockCalls } = installLockSpies();
    pageState.versions = [getVersion()];
    async function fetchServerFailure() {
        return new Response('boom', { status: 500 });
    }
    globalThis.fetch = fetchServerFailure as unknown as typeof fetch;
    await executeSubmit();
    mock.restore();
    expect(lockCalls).toEqual([true, true, false, false]);
}

async function validateEditorsAreUnlockedAfterAThrownFetchErrorAndTheErrorStillThrows() {
    installFakeDom(true);
    const { lockCalls } = installLockSpies();
    pageState.versions = [getVersion()];
    async function fetchNetworkDown() {
        throw new Error('network down');
    }
    globalThis.fetch = fetchNetworkDown as unknown as typeof fetch;
    const submitPromise = executeSubmit();
    await expect(submitPromise).rejects.toThrow('network down');
    mock.restore();
    expect(lockCalls).toEqual([true, true, false, false]);
}

function validateLockableEditorsHoldTheStateAndQuestionsEditorsAndLockingReachesEachOne() {
    const { lockCalls, lockedEditors, stateEditor, questionsEditor } = installLockSpies();
    expect(listLockableEditors()).toEqual([stateEditor, questionsEditor]);
    setEditorsLocked(true);
    mock.restore();
    expect(lockCalls).toEqual([true, true]);
    expect(lockedEditors).toEqual([stateEditor, questionsEditor]);
}

async function validateInvalidStateNeverLocksTheEditors() {
    installFakeDom(true);
    const { lockCalls } = installLockSpies();
    spyOn(editors, 'getStateEditor').mockReturnValue(buildStubStateEditor('{"a":'));
    await executeSubmit();
    mock.restore();
    expect(lockCalls).toEqual([]);
}

function registerLockTests() {
    afterEach(removeFakeDom);
    test('test_invalid_state_never_locks_the_editors', validateInvalidStateNeverLocksTheEditors);
    test('test_editors_are_locked_while_the_run_is_in_flight_and_unlocked_after_success', validateEditorsAreLockedWhileTheRunIsInFlightAndUnlockedAfterSuccess);
    test('test_editors_are_unlocked_after_an_error_response', validateEditorsAreUnlockedAfterAnErrorResponse);
    test('test_editors_are_unlocked_after_a_thrown_fetch_error_and_the_error_still_throws', validateEditorsAreUnlockedAfterAThrownFetchErrorAndTheErrorStillThrows);
    test('test_lockable_editors_hold_the_state_and_questions_editors_and_locking_reaches_each_one', validateLockableEditorsHoldTheStateAndQuestionsEditorsAndLockingReachesEachOne);
}

describe('submitLock', registerLockTests);
