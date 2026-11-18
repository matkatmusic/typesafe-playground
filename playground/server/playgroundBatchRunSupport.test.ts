import { test, expect } from 'bun:test';
import { existsSync } from 'node:fs';
import { loadHistory } from '../history/playgroundHistory';
import { buildCountingClientFactory, buildPost, buildTempHistoryPath, getPort } from './playgroundBatchRunSupport';

function validateGetPortReturnsTheFixedTestPort() {
    // Step: ask for the port. It is the fixed test port.
    expect(getPort()).toBe(4323);
}

async function validateBuildPostMakesAJsonPostRequestForTheAllowedHost() {
    // Step: build a post request with a body.
    const request = buildPost('/run', { a: 1 });
    // Step: the request has the method, the url, the host headers and the json body.
    expect(request.method).toBe('POST');
    expect(request.url).toBe('http://127.0.0.1:4323/run');
    expect(request.headers.get('host')).toBe('127.0.0.1:4323');
    expect(request.headers.get('origin')).toBe('http://127.0.0.1:4323');
    expect(request.headers.get('content-type')).toBe('application/json');
    expect(await request.json()).toEqual({ a: 1 });
}

async function validateBuildTempHistoryPathMakesAnInitializedHistoryFile() {
    // Step: build a temp history path.
    const historyPath = await buildTempHistoryPath();
    // Step: the history file exists and holds one unrun default version.
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

async function validateCountingClientRecordsEveryStateItSees() {
    // Step: build a counting client that never fails and call it twice.
    const { seenStates, createClient } = buildCountingClientFactory(null);
    const client = createClient();
    const buildRequest = (state: unknown) => ({ state }) as never;
    const firstOutput = await client.systemOne(buildRequest({ a: 1 }));
    await client.systemOne(buildRequest({ a: 2 }));
    // Step: both states are recorded in call order, and the output has the fake usage.
    expect(seenStates).toEqual([{ a: 1 }, { a: 2 }]);
    expect(firstOutput.usage).toEqual({ input_tokens: 7, output_tokens: 1 });
}

async function validateCountingClientThrowsOnTheChosenCallOnly() {
    // Step: build a counting client that fails on call 2.
    const { seenStates, createClient } = buildCountingClientFactory(2);
    const client = createClient();
    const buildRequest = (state: unknown) => ({ state }) as never;
    // Step: call 1 works, call 2 throws, call 3 works again.
    await client.systemOne(buildRequest({ a: 1 }));
    await expect(client.systemOne(buildRequest({ a: 2 }))).rejects.toThrow('call failed');
    await client.systemOne(buildRequest({ a: 3 }));
    // Step: the failed call is still recorded.
    expect(seenStates.length).toBe(3);
}

test('test_get_port_returns_the_fixed_test_port', validateGetPortReturnsTheFixedTestPort);
test('test_build_post_makes_a_json_post_request_for_the_allowed_host', validateBuildPostMakesAJsonPostRequestForTheAllowedHost);
test('test_build_temp_history_path_makes_an_initialized_history_file', validateBuildTempHistoryPathMakesAnInitializedHistoryFile);
test('test_build_temp_history_path_makes_a_different_path_each_time', validateBuildTempHistoryPathMakesADifferentPathEachTime);
test('test_counting_client_records_every_state_it_sees', validateCountingClientRecordsEveryStateItSees);
test('test_counting_client_throws_on_the_chosen_call_only', validateCountingClientThrowsOnTheChosenCallOnly);
