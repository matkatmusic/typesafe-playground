import { describe, test, expect, afterEach } from 'bun:test';
import type { ChartLayout } from './graphTypes';
import { graphState } from './graphState';
import { isRunDataPresent, renderGraphs, renderStaleCharts } from './graphs';
import { FakeElement, installFakeDocument, removeFakeDocument, createEmptyVersion, createFilledVersion, createTwoQuestionsVersion, createChartRecorder } from './graphsFakeDom';

function validateRunDataPresence() {
    expect(isRunDataPresent(createEmptyVersion(), 'q')).toBe(false);
    expect(isRunDataPresent(createFilledVersion(), 'q')).toBe(true);
    expect(isRunDataPresent(createFilledVersion(), 'other')).toBe(false);
}

function validateBlocksChartsAndEmptyMessages() {
    installFakeDocument();
    const container = new FakeElement();
    const drawn: ChartLayout[][] = [];
    renderGraphs(createTwoQuestionsVersion(), container as unknown as HTMLElement, createChartRecorder(drawn));
    expect(container.children.length).toBe(2);
    expect(drawn.length).toBe(1);
    expect(drawn[0].length).toBe(1);
    expect(drawn[0][0].name).toBe('q');
    expect(drawn[0][0].keys).toEqual(['yes']);
    const otherBox = container.children[1].children[1];
    expect(otherBox.textContent).toBe('Submit a run to generate a graph');
    expect(otherBox.classes).toEqual(['empty']);
}

function validateCollapsedQuestionDrawsNoChart() {
    installFakeDocument();
    graphState.collapsedByName.q = true;
    const container = new FakeElement();
    const drawn: ChartLayout[][] = [];
    renderGraphs(createTwoQuestionsVersion(), container as unknown as HTMLElement, createChartRecorder(drawn));
    expect(drawn[0].length).toBe(0);
    expect(container.children[0].classes).toEqual(['collapsed']);
}

function validateTogglingAverageRendersAgain() {
    installFakeDocument();
    const container = new FakeElement();
    const drawn: ChartLayout[][] = [];
    renderGraphs(createTwoQuestionsVersion(), container as unknown as HTMLElement, createChartRecorder(drawn));
    const checkbox = container.children[0].children[0].children[3].children[0];
    checkbox.checked = true;
    checkbox.listeners.change();
    expect(drawn.length).toBe(2);
    expect(drawn[1][0].isAverageShown).toBe(true);
}

function createChartRecorderThatGrowsBoxOnFirstDraw(drawn: ChartLayout[][]) {
    function pushChartsAndGrowBoxOnFirstDraw(charts: ChartLayout[]) {
        drawn.push(charts);
        if (drawn.length === 1)
            (charts[0].box as unknown as FakeElement).clientHeight = 400;
    }
    return pushChartsAndGrowBoxOnFirstDraw;
}

function validateChartsTallerBlocksAreDrawnAgainAfterTheInfoBox() {
    installFakeDocument();
    const container = new FakeElement();
    const drawn: ChartLayout[][] = [];
    const growBoxOnFirstDraw = createChartRecorderThatGrowsBoxOnFirstDraw(drawn);
    renderGraphs(createTwoQuestionsVersion(), container as unknown as HTMLElement, growBoxOnFirstDraw);
    expect(drawn.length).toBe(2);
    expect(drawn[0][0].plotH).toBe(156);
    expect(drawn[1][0].plotH).toBe(356);
    renderStaleCharts(drawn[1], growBoxOnFirstDraw);
    expect(drawn.length).toBe(2);
}

function registerGraphsTests() {
    afterEach(removeFakeDocument);
    test('test_charts_in_taller_blocks_are_drawn_again_after_the_info_box', validateChartsTallerBlocksAreDrawnAgainAfterTheInfoBox);
    test('test_run_data_is_present_only_with_an_output_for_the_name', validateRunDataPresence);
    test('test_render_graphs_draws_charts_and_empty_messages', validateBlocksChartsAndEmptyMessages);
    test('test_collapsed_question_draws_no_chart', validateCollapsedQuestionDrawsNoChart);
    test('test_toggling_average_renders_again', validateTogglingAverageRendersAgain);
}

describe('graphs', registerGraphsTests);
