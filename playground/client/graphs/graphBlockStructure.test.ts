import { describe, test, expect, afterEach } from 'bun:test';
import { graphState } from './graphState';
import { createGraphBlock } from './graphBlock';
import { executeNothing, getVersion, installFakeDocument, removeFakeDocument } from './graphBlockFakeDom';
import type { FakeElement } from './graphBlockFakeDom';

function validateBlockHoldsTitleRowThenChartBox() {
    installFakeDocument();
    graphState.collapsedByName.q = true;
    const graphBlock = createGraphBlock(1, 'q', { type: 'noul' }, executeNothing, getVersion());
    const block = graphBlock.block as unknown as FakeElement;
    expect(block.classes).toEqual(['collapsed']);
    expect(block.children.length).toBe(2);
    expect(block.children[1]).toBe(graphBlock.box);
    const titleRow = block.children[0] as FakeElement;
    expect(titleRow.children.length).toBe(3);
}

function validateResultNotesButtonShowsOnlyForAVersionWithARun() {
    installFakeDocument();
    const withoutRun = createGraphBlock(1, 'q', { type: 'noul' }, executeNothing, getVersion());
    const withRun = createGraphBlock(1, 'q', { type: 'noul' }, executeNothing, { ...getVersion(), outputs: [{}] as never });
    const emptyRow = (withoutRun.block as unknown as FakeElement).children[0] as FakeElement;
    const runRow = (withRun.block as unknown as FakeElement).children[0] as FakeElement;
    expect(emptyRow.children.length).toBe(3);
    expect(runRow.children.length).toBe(4);
    const button = runRow.children[2] as unknown as { id: string; textContent: string };
    expect(button.id).toBe('resultNotesButtonq');
    expect(button.textContent).toBe('notes');
}

function registerGraphBlockStructureTests() {
    afterEach(removeFakeDocument);
    test('test_block_holds_title_row_then_chart_box', validateBlockHoldsTitleRowThenChartBox);
    test('test_result_notes_button_shows_only_for_a_version_with_a_run', validateResultNotesButtonShowsOnlyForAVersionWithARun);
}

describe('graphBlockStructure', registerGraphBlockStructureTests);
