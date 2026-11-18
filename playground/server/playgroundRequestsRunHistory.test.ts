import { test, expect } from 'bun:test';
import { getNotRunTime } from '../history/notRunTime';
import { addRunToHistory, executeRunRequest } from './playgroundRequests';
import { loadHistory, type RunOutput } from '../history/playgroundHistory';
import type { RunResult } from '../client/page/types';
import { getHardCodedQuestions, getHardCodedState } from '../providers/typeSafeQuery';
import { getStubOutput,buildTempHistoryPath, createRunRequest, createStubFactory, type Call } from './playgroundRequestsSupport';

async function validateClientReceivesTheTypedStateAndQuestionsOncePerCall() {
    Bun.env.TYPESAFE_API_KEY = 'env-key';
    const calls: Call[] = [];
    const typedState = { text: 'typed' };
    const typedQuestions = { other: getHardCodedQuestions().requestsAction };
    await executeRunRequest(createRunRequest({ calls: 3, state: typedState, questions: typedQuestions }), createStubFactory(calls), await buildTempHistoryPath());
    expect(calls.length).toBe(3);
    for (const call of calls)
        expect(call.request).toEqual({ state: typedState, questions: typedQuestions });
}

async function validateHistoryHoldsOnlyTheVersion(historyPath: string, version: RunResult['version']) {
    const history = await loadHistory(historyPath);
    expect(history.length).toBe(1);
    expect(history[0]).toEqual(version);
}

async function validateRunAppendsToTheLastVersionAndRespondsWithOutputsAndVersion() {
    Bun.env.TYPESAFE_API_KEY = 'env-key';
    const historyPath = await buildTempHistoryPath();
    const factory = createStubFactory([]);
    const first = (await (await executeRunRequest(createRunRequest({ calls: 2, state: getHardCodedState() }), factory, historyPath)).json()) as RunResult;
    expect(first.outputs).toEqual([{ ...getStubOutput(), provider: 'TypeSafe' }, { ...getStubOutput(), provider: 'TypeSafe' }]);
    expect(first.index).toBe(0);
    expect(first.version.calls).toBe(2);
    const second = (await (await executeRunRequest(createRunRequest({ calls: 3, state: getHardCodedState() }), factory, historyPath)).json()) as RunResult;
    expect(second.outputs.length).toBe(3);
    expect(second.version.calls).toBe(5);
    expect(second.version.outputs.length).toBe(5);
    await validateHistoryHoldsOnlyTheVersion(historyPath, second.version);
}

function buildShownWithTime(time: string) {
    return { time, state: getHardCodedState(), questions: getHardCodedQuestions(), calls: 0, outputs: [] as RunOutput[] };
}

function validateKeepStampsARealTimeOnANotRunVersion() {
    const shown = buildShownWithTime(getNotRunTime());
    addRunToHistory([shown], shown, [getStubOutput()], getHardCodedState(), getHardCodedQuestions());
    expect(shown.time).not.toBe(getNotRunTime());
    expect(Number.isNaN(new Date(shown.time).getTime())).toBe(false);
}

function validateOverwriteStampsARealTimeOnANotRunVersion() {
    const shown = buildShownWithTime(getNotRunTime());
    addRunToHistory([shown], shown, [getStubOutput()], { message: { text: 'edited' } }, getHardCodedQuestions());
    expect(shown.state).toEqual({ message: { text: 'edited' } });
    expect(Number.isNaN(new Date(shown.time).getTime())).toBe(false);
}

function validateARealTimeIsKeptOnLaterRuns() {
    const shown = buildShownWithTime('2026-01-02T03:04:05.000Z');
    addRunToHistory([shown], shown, [getStubOutput()], getHardCodedState(), getHardCodedQuestions());
    expect(shown.time).toBe('2026-01-02T03:04:05.000Z');
}

test('test_run_sends_the_typed_state_and_questions_once_per_call', validateClientReceivesTheTypedStateAndQuestionsOncePerCall);
test('test_run_appends_to_the_last_version_and_responds_with_outputs_and_version', validateRunAppendsToTheLastVersionAndRespondsWithOutputsAndVersion);
test('test_keep_stamps_a_real_time_on_a_not_run_version', validateKeepStampsARealTimeOnANotRunVersion);
test('test_overwrite_stamps_a_real_time_on_a_not_run_version', validateOverwriteStampsARealTimeOnANotRunVersion);
test('test_a_real_time_is_kept_on_later_runs', validateARealTimeIsKeptOnLaterRuns);
