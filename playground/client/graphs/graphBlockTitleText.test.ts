import { test, expect, afterEach, describe } from 'bun:test';
import { graphState } from './graphState';
import { createGraphBlock, formatGraphTitle } from './graphBlock';
import { executeNothing, getVersion, installFakeDocument, removeFakeDocument } from './graphBlockFakeDom';
import type { FakeElement } from './graphBlockFakeDom';

function validateGraphTitleHoldsNumberNameAndInstructions() {
    const title = formatGraphTitle(2, 'needsTask', { type: 'noul', instructions: 'Is it?' });
    expect(title).toBe('Q2 needsTask · Is it?');
    expect(formatGraphTitle(1, 'n', { type: 'noul' })).toBe('Q1 n · (none)');
}

function readTitleParts(isReferencesReplaced: boolean, name = 'q'): FakeElement[] {
    installFakeDocument();
    graphState.isReferencesReplaced = isReferencesReplaced;
    const question = { type: 'noul', instructions: 'Does `message.text` ask?' } as const;
    const graphBlock = createGraphBlock(1, name, question, executeNothing, { ...getVersion(), state: { message: { text: 'Hi.' } } });
    const block = graphBlock.block as unknown as FakeElement;
    const titleRow = block.children[0] as FakeElement;
    return (titleRow.children[1] as FakeElement).children as FakeElement[];
}

function readTitleText(isReferencesReplaced: boolean, name = 'q'): string {
    let text = '';
    for (const part of readTitleParts(isReferencesReplaced, name))
        text += part.textContent;
    return text;
}

function validateTitleReferencesAreReplacedOnlyWhenTheToggleIsOn() {
    expect(readTitleText(false)).toBe('Q1 q · Does `message.text` ask?');
    expect(readTitleText(true)).toBe("Q1 q · Does 'Hi.' ask?");
}

function validateReplacedReferencesKeepTheInstructionsWholeWhenTheNameHasAReference() {
    expect(readTitleText(true, 'a`message.text`b')).toBe("Q1 a`message.text`b · Does 'Hi.' ask?");
}

function validateTitleReferenceShowsTheReplacedTextInATooltip() {
    const parts = readTitleParts(false);
    expect(parts.length).toBe(4);
    expect(parts[2].className).toBe('backtick-ref');
    expect(parts[2].textContent).toBe('`message.text`');
    expect(parts[2].title).toBe('');
    expect(typeof parts[2].listeners.mouseenter).toBe('function');
    expect(typeof parts[2].listeners.mouseleave).toBe('function');
}

function registerGraphBlockTitleTextTests() {
    afterEach(removeFakeDocument);
    test('test_graph_title_holds_number_name_and_instructions', validateGraphTitleHoldsNumberNameAndInstructions);
    test('test_title_references_are_replaced_only_when_the_toggle_is_on', validateTitleReferencesAreReplacedOnlyWhenTheToggleIsOn);
    test('test_replaced_references_keep_the_instructions_whole_when_the_name_has_a_reference', validateReplacedReferencesKeepTheInstructionsWholeWhenTheNameHasAReference);
    test('test_title_reference_shows_the_replaced_text_in_a_tooltip', validateTitleReferenceShowsTheReplacedTextInATooltip);
}

describe('graphBlockTitleText', registerGraphBlockTitleTextTests);
