import { test, expect, afterEach, describe } from 'bun:test';
import { toggleResultJson } from './resultJsonToggle';

function removeFakeDocument() {
    Reflect.deleteProperty(globalThis, 'document');
}

function validateToggleSwapsTheGraphsAndTheJson() {
    const editorBox = { hidden: true };
    const graphBox = { hidden: false };
    const boxes: Record<string, { hidden: boolean }> = { resultJsonEditor: editorBox, graphContainerBox: graphBox };
    function getElementById(id: string) {
        return boxes[id] ?? null;
    }
    Object.assign(globalThis, { document: { getElementById } });
    toggleResultJson();
    expect(editorBox.hidden).toBe(false);
    expect(graphBox.hidden).toBe(true);
    toggleResultJson();
    expect(editorBox.hidden).toBe(true);
    expect(graphBox.hidden).toBe(false);
}

function registerResultJsonToggleTests() {
    afterEach(removeFakeDocument);
    test('test_toggle_swaps_the_graphs_and_the_json', validateToggleSwapsTheGraphsAndTheJson);
}

describe('resultJsonToggle', registerResultJsonToggleTests);
