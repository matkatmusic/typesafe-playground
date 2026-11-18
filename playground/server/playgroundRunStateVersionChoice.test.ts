import { test, expect } from 'bun:test';
import { executeRunRequest } from './playgroundRequests';
import { loadHistory, type Version } from '../history/playgroundHistory';
import { getHardCodedQuestions } from '../providers/typeSafeQuery';
import { getStubRunOutput, buildFourVersionHistoryPath, buildTempHistoryPath, createRunRequest, createStubFactory } from './playgroundRunStateSupport';

async function validateChangedQuestionsMakeANewVersionAndSameQuestionsAppend() {
    Bun.env.TYPESAFE_API_KEY = 'env-key';
    const historyPath = await buildFourVersionHistoryPath();
    const factory = createStubFactory([]);
    const changedQuestions = { other: getHardCodedQuestions().requestsAction };
    const first = (await (await executeRunRequest(createRunRequest({ v: 4 }, 3, changedQuestions), factory, historyPath)).json()) as { version: Version; index: number };
    expect(first.index).toBe(4);
    expect(first.version.questions).toEqual(changedQuestions);
    const second = (await (await executeRunRequest(createRunRequest({ v: 4 }, 4, changedQuestions), factory, historyPath)).json()) as { version: Version; index: number };
    expect(second.index).toBe(4);
    expect(second.version.calls).toBe(2);
    const history = await loadHistory(historyPath);
    expect(history.length).toBe(5);
    expect(history[3].outputs).toEqual([getStubRunOutput()]);
}

async function validateChangedStateMakesANewVersionAndSameStateAppends() {
    Bun.env.TYPESAFE_API_KEY = 'env-key';
    const historyPath = await buildTempHistoryPath();
    const factory = createStubFactory([]);
    const first = (await (await executeRunRequest(createRunRequest({ a: 1 }), factory, historyPath)).json()) as { version: Version; index: number };
    expect(first.index).toBe(0);
    const second = (await (await executeRunRequest(createRunRequest({ a: 1 }, 0), factory, historyPath)).json()) as { version: Version; index: number };
    expect(second.index).toBe(0);
    expect(second.version.calls).toBe(2);
    const third = (await (await executeRunRequest(createRunRequest({ a: 2 }, 0), factory, historyPath)).json()) as { version: Version; index: number };
    expect(third.index).toBe(1);
    const history = await loadHistory(historyPath);
    expect(history.length).toBe(2);
    expect([history[0].state, history[1].state]).toEqual([{ a: 1 }, { a: 2 }]);
}

async function validateUnchangedInputAppendsToTheShownVersionNotTheLast() {
    Bun.env.TYPESAFE_API_KEY = 'env-key';
    const historyPath = await buildFourVersionHistoryPath();
    const response = await executeRunRequest(createRunRequest({ v: 2 }, 1), createStubFactory([]), historyPath);
    const result = (await response.json()) as { version: Version; index: number };
    expect(result.index).toBe(1);
    expect(result.version.calls).toBe(2);
    const history = await loadHistory(historyPath);
    expect(history.length).toBe(4);
    expect(history[1].outputs.length).toBe(2);
    expect(history[3].outputs.length).toBe(1);
}

async function validateChangedInputOnAnEarlierVersionPushesAtTheEnd() {
    Bun.env.TYPESAFE_API_KEY = 'env-key';
    const historyPath = await buildFourVersionHistoryPath();
    const response = await executeRunRequest(createRunRequest({ v: 'edited' }, 1), createStubFactory([]), historyPath);
    const result = (await response.json()) as { version: Version; index: number };
    expect(result.index).toBe(4);
    const history = await loadHistory(historyPath);
    expect(history.length).toBe(5);
    expect(history[4].state).toEqual({ v: 'edited' });
    expect(history[1].outputs).toEqual([getStubRunOutput()]);
}

async function validateStateEqualToTheLastButNotTheShownVersionPushesANewVersion() {
    Bun.env.TYPESAFE_API_KEY = 'env-key';
    const historyPath = await buildFourVersionHistoryPath();
    const response = await executeRunRequest(createRunRequest({ v: 4 }, 1), createStubFactory([]), historyPath);
    const result = (await response.json()) as { version: Version; index: number };
    expect(result.index).toBe(4);
    expect((await loadHistory(historyPath))[3].outputs).toEqual([getStubRunOutput()]);
}

test('test_changed_questions_make_a_new_version_and_same_questions_append', validateChangedQuestionsMakeANewVersionAndSameQuestionsAppend);
test('test_unchanged_input_appends_to_the_shown_version_not_the_last', validateUnchangedInputAppendsToTheShownVersionNotTheLast);
test('test_changed_input_on_an_earlier_version_pushes_at_the_end', validateChangedInputOnAnEarlierVersionPushesAtTheEnd);
test('test_state_equal_to_the_last_but_not_the_shown_version_pushes_a_new_version', validateStateEqualToTheLastButNotTheShownVersionPushesANewVersion);
test('test_changed_state_makes_a_new_version_and_same_state_appends', validateChangedStateMakesANewVersionAndSameStateAppends);
