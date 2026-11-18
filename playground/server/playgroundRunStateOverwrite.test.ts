import { test, expect } from 'bun:test';
import { executeRunRequest } from './playgroundRequests';
import { loadHistory, type Version } from '../history/playgroundHistory';
import { getHardCodedQuestions, getHardCodedState } from '../providers/typeSafeQuery';
import { getStubRunOutput, buildTempHistoryPath, createRunRequest, createStubFactory } from './playgroundRunStateSupport';

async function validateOnlyVersionWithDefaultStateAndEditedQuestionsIsOverwrittenInPlace() {
    Bun.env.TYPESAFE_API_KEY = 'env-key';
    const historyPath = await buildTempHistoryPath();
    const editedQuestions = { other: getHardCodedQuestions().requestsAction };
    const response = await executeRunRequest(createRunRequest({ typed: 'edited' }, 0, editedQuestions), createStubFactory([]), historyPath);
    const result = (await response.json()) as { version: Version; index: number };
    expect(result.index).toBe(0);
    const history = await loadHistory(historyPath);
    expect(history.length).toBe(1);
    expect(history[0].state).toEqual({ typed: 'edited' });
    expect(history[0].questions).toEqual(editedQuestions);
    expect(history[0].outputs).toEqual([{ ...getStubRunOutput(), provider: 'TypeSafe' }]);
}

async function validateVersionWithResultsAndChangedStateMakesASecondVersion() {
    Bun.env.TYPESAFE_API_KEY = 'env-key';
    const historyPath = await buildTempHistoryPath();
    const factory = createStubFactory([]);
    await executeRunRequest(createRunRequest(getHardCodedState()), factory, historyPath);
    const response = await executeRunRequest(createRunRequest({ typed: 'changed' }), factory, historyPath);
    const result = (await response.json()) as { version: Version; index: number };
    expect(result.index).toBe(1);
    const history = await loadHistory(historyPath);
    expect(history.length).toBe(2);
    expect(history[0].outputs).toEqual([{ ...getStubRunOutput(), provider: 'TypeSafe' }]);
    expect(history[1].state).toEqual({ typed: 'changed' });
}

test('test_only_version_with_default_state_and_edited_questions_is_overwritten_in_place', validateOnlyVersionWithDefaultStateAndEditedQuestionsIsOverwrittenInPlace);
test('test_version_with_results_and_changed_state_makes_a_second_version', validateVersionWithResultsAndChangedStateMakesASecondVersion);
