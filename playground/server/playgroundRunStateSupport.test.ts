import { test, expect } from 'bun:test';
import { existsSync } from 'node:fs';
import { loadHistory } from '../history/playgroundHistory';
import { getHardCodedQuestions, getHardCodedState } from '../providers/typeSafeQuery';
import { buildFourVersionHistoryPath, buildTempHistoryPath, createRunRequest, createStubFactory, getStubRunOutput } from './playgroundRunStateSupport';

function validateStubRunOutputHasEmptyAnswersAndFixedUsage() {
    // Ask for a stub output.
    const output = getStubRunOutput();
    // Check the answers are empty and the usage is fixed.
    expect(output.answers).toEqual({});
    expect(output.usage).toEqual({ input_tokens: 5, output_tokens: 1 });
}

async function validateTempHistoryPathHoldsOneBlankVersion() {
    // Build a temp history path.
    const historyPath = await buildTempHistoryPath();
    // Check the file exists and holds one blank version with no outputs.
    expect(existsSync(historyPath)).toBe(true);
    const history = await loadHistory(historyPath);
    expect(history.length).toBe(1);
    expect(history[0].outputs).toEqual([]);
}

async function validateFourVersionHistoryPathHoldsStatesOneToFour() {
    // Build a history path with four versions.
    const historyPath = await buildFourVersionHistoryPath();
    // Check the four versions hold state v 1 to v 4.
    const history = await loadHistory(historyPath);
    const states: unknown[] = [];
    for (const version of history)
        states.push(version.state);
    expect(states).toEqual([{ v: 1 }, { v: 2 }, { v: 3 }, { v: 4 }]);
}

async function validateStubFactoryRecordsApiKeyAndReturnsStubOutput() {
    // Make a factory that records keys.
    const seenKeys: string[] = [];
    const factory = createStubFactory(seenKeys);
    // Make a client and run system one.
    const client = factory('my-key', 'TypeSafe');
    const output = await client.systemOne({ state: getHardCodedState(), questions: getHardCodedQuestions() });
    // Check the key is recorded and the output is the stub output.
    expect(seenKeys).toEqual(['my-key']);
    expect(output).toEqual(getStubRunOutput());
}

async function validateRunRequestIsAPostWithGivenIndexStateAndQuestions() {
    // Build a request.
    const request = createRunRequest({ v: 2 }, 3);
    // Check the method and the body.
    expect(request.method).toBe('POST');
    const body = await request.json();
    expect(body).toEqual({ index: 3, calls: 1, state: { v: 2 }, questions: getHardCodedQuestions() });
}

test('test_stub_run_output_has_empty_answers_and_fixed_usage', validateStubRunOutputHasEmptyAnswersAndFixedUsage);
test('test_temp_history_path_holds_one_blank_version', validateTempHistoryPathHoldsOneBlankVersion);
test('test_four_version_history_path_holds_states_one_to_four', validateFourVersionHistoryPathHoldsStatesOneToFour);
test('test_stub_factory_records_api_key_and_returns_stub_output', validateStubFactoryRecordsApiKeyAndReturnsStubOutput);
test('test_run_request_is_a_post_with_given_index_state_and_questions', validateRunRequestIsAPostWithGivenIndexStateAndQuestions);
