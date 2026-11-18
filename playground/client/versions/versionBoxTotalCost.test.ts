import { describe, test, expect, afterEach, spyOn } from 'bun:test';
import * as editors from '../editors/editors';
import * as graphs from '../graphs/graphs';
import * as winnersDom from '../runs/winnersDom';
import { pageState } from '../page/state';
import { renderLastVersion } from './versionBox';
import { buildStubStateEditor, installFakeDom, installQuestionsStub, createVersion, removeFakeState } from './versionBoxFakeDom';

function clearRenderCall() {}

function installRenderStubs() {
    spyOn(editors, 'renderStateJson').mockImplementation(clearRenderCall);
    spyOn(editors, 'renderResultJson').mockImplementation(clearRenderCall);
    spyOn(graphs, 'renderGraphs').mockImplementation(clearRenderCall);
    spyOn(winnersDom, 'renderWinners').mockImplementation(clearRenderCall);
    spyOn(editors, 'getStateEditor').mockReturnValue(buildStubStateEditor('{"a":1}'));
    installQuestionsStub('{}');
}

function getOutputsWithOneMillionInputTokens() {
    return [{ usage: { input_tokens: 1000000, output_tokens: 1 } }];
}

function validateEveryRenderOfAVersionShowsTheTotalCostOfAllVersions() {
    // Step: two versions, each with 1000000 input tokens; every render shows their combined cost.
    const elements = installFakeDom();
    installRenderStubs();
    const outputs = getOutputsWithOneMillionInputTokens();
    pageState.versions = [{ ...createVersion(1, { a: 1 }), outputs }, { ...createVersion(2, { b: 2 }), outputs }] as never;
    renderLastVersion();
    expect(elements.totalCostLabel.textContent).toBe('total cost: $0.084000');
    expect(elements.costLabel.textContent).toBe('Cost: $0.042000');
}

function validateTotalCostShrinksWhenAVersionIsRemovedOrItsRunsAreCleared() {
    // Step: one version is removed or its runs are cleared, then the next render shows the new total.
    const elements = installFakeDom();
    installRenderStubs();
    const outputs = getOutputsWithOneMillionInputTokens();
    pageState.versions = [{ ...createVersion(1, { a: 1 }), outputs }] as never;
    renderLastVersion();
    expect(elements.totalCostLabel.textContent).toBe('total cost: $0.042000');
    pageState.versions = [createVersion(1, { a: 1 })] as never;
    renderLastVersion();
    expect(elements.totalCostLabel.textContent).toBe('total cost: $0.000000');
}

function registerTotalCostTests() {
    afterEach(removeFakeState);
    test('test_every_render_of_a_version_shows_the_total_cost_of_all_versions', validateEveryRenderOfAVersionShowsTheTotalCostOfAllVersions);
    test('test_total_cost_shrinks_when_a_version_is_removed_or_its_runs_are_cleared', validateTotalCostShrinksWhenAVersionIsRemovedOrItsRunsAreCleared);
}

describe('versionBox total cost', registerTotalCostTests);
