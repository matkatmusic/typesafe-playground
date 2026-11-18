import { test, expect } from 'bun:test';
import { existsSync } from 'node:fs';
import { loadHistory } from '../history/playgroundHistory';
import { getHardCodedQuestions } from '../providers/typeSafeQuery';
import { buildTempHistoryPath, createRunRequest, createStubFactory, getStubOutput, type Call } from './playgroundRequestsSupport';

function validateGetStubOutputHasNoAnswersAndFakeUsage() {
    // Step: ask for the stub output.
    const output = getStubOutput();
    // Step: it has no answers and the fake usage.
    expect(output.answers).toEqual({});
    expect(output.usage).toEqual({ input_tokens: 5, output_tokens: 1 });
}

async function validateBuildTempHistoryPathMakesAnInitializedHistoryFile() {
    // Step: build a temp history path.
    const historyPath = await buildTempHistoryPath();
    // Step: the history file exists and holds one default version.
    expect(existsSync(historyPath)).toBe(true);
    const history = await loadHistory(historyPath);
    expect(history.length).toBe(1);
}

async function validateBuildTempHistoryPathMakesADifferentPathEachTime() {
    // Step: build two temp history paths.
    const firstPath = await buildTempHistoryPath();
    const secondPath = await buildTempHistoryPath();
    // Step: the two paths are different.
    expect(firstPath).not.toBe(secondPath);
}

async function validateStubFactoryRecordsTheKeyAndRequestOfEachCall() {
    // Step: build a stub factory and make a client with an api key.
    const calls: Call[] = [];
    const createClient = createStubFactory(calls);
    const client = createClient('key-1', 'TypeSafe');
    // Step: call the client twice.
    await client.systemOne({ a: 1 } as never);
    await client.systemOne({ a: 2 } as never);
    // Step: both calls are recorded in order with the api key.
    expect(calls).toEqual([
        { apiKey: 'key-1', request: { a: 1 } },
        { apiKey: 'key-1', request: { a: 2 } },
    ]);
}

async function validateStubClientReturnsTheStubOutput() {
    // Step: build a stub client and call it.
    const client = createStubFactory([])('key-1', 'TypeSafe');
    const output = await client.systemOne({} as never);
    // Step: the output is the stub output.
    expect(output).toEqual(getStubOutput());
}

async function validateCreateRunRequestMakesAPostRequestWithDefaultBodyFields() {
    // Step: build a run request with no extra fields.
    const request = createRunRequest({});
    // Step: it is a post request to the run url.
    expect(request.method).toBe('POST');
    expect(request.url).toBe('http://127.0.0.1:4399/run');
    // Step: the body has the default index, state and questions.
    const body = await request.json();
    expect(body.index).toBe(0);
    expect(body.state).toEqual({});
    expect(body.questions).toEqual(getHardCodedQuestions());
}

async function validateCreateRunRequestLetsTheBodyOverrideTheDefaults() {
    // Step: build a run request with an index and a state.
    const request = createRunRequest({ index: 3, state: { a: 1 } });
    // Step: the given fields replace the defaults.
    const body = await request.json();
    expect(body.index).toBe(3);
    expect(body.state).toEqual({ a: 1 });
}

test('test_get_stub_output_has_no_answers_and_fake_usage', validateGetStubOutputHasNoAnswersAndFakeUsage);
test('test_build_temp_history_path_makes_an_initialized_history_file', validateBuildTempHistoryPathMakesAnInitializedHistoryFile);
test('test_build_temp_history_path_makes_a_different_path_each_time', validateBuildTempHistoryPathMakesADifferentPathEachTime);
test('test_stub_factory_records_the_key_and_request_of_each_call', validateStubFactoryRecordsTheKeyAndRequestOfEachCall);
test('test_stub_client_returns_the_stub_output', validateStubClientReturnsTheStubOutput);
test('test_create_run_request_makes_a_post_request_with_default_body_fields', validateCreateRunRequestMakesAPostRequestWithDefaultBodyFields);
test('test_create_run_request_lets_the_body_override_the_defaults', validateCreateRunRequestLetsTheBodyOverrideTheDefaults);
