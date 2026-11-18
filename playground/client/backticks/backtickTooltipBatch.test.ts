import { test, expect, afterEach, describe } from 'bun:test';
import type { EditorView } from '@codemirror/view';
import { pageState } from '../page/state';
import {
    type FakeNode, getQuestionsText, getBodyChildren, createSource, createView, installFakeDocument, removeFakeDocument, collectAppendReferenceText,
} from './backtickTooltipFakeDom';

function validateBatchOnHoverShowsTheFixedTextForFoundAndUnknownNames() {
    installFakeDocument();
    pageState.isBatchOn = true;
    const foundFrom = getQuestionsText().indexOf('message.text');
    const unknownFrom = getQuestionsText().indexOf('nope');
    const source = createSource('[{"message": {"text": "Hello"}}]', getQuestionsText());
    for (const from of [foundFrom, unknownFrom]) {
        const tooltip = source(createView(getQuestionsText()), from + 1);
        const dom = tooltip?.create({} as EditorView).dom as unknown as FakeNode;
        expect(dom.textContent).toBe('hover text replacement not active in batch mode');
        expect(tooltip?.pos).toBe(from);
    }
    expect(source(createView(getQuestionsText()), getQuestionsText().indexOf('Plain') + 2)).toBe(null);
}

function validateBatchOnLeavesTheSavedVersionTooltipsAlone() {
    pageState.isBatchOn = true;
    const nodes = collectAppendReferenceText('`count`', { count: 3 }, {});
    nodes[1].listeners.mouseenter();
    expect(getBodyChildren()[0].textContent).toBe("'3'");
}

function resetBatchOff() {
    pageState.isBatchOn = false;
}

function registerBatchTooltipTests() {
    afterEach(removeFakeDocument);
    afterEach(resetBatchOff);
    test('test_batch_on_hover_shows_the_fixed_text_for_found_and_unknown_names', validateBatchOnHoverShowsTheFixedTextForFoundAndUnknownNames);
    test('test_batch_on_leaves_the_saved_version_tooltips_alone', validateBatchOnLeavesTheSavedVersionTooltipsAlone);
}

describe('backtick tooltip in batch mode', registerBatchTooltipTests);
