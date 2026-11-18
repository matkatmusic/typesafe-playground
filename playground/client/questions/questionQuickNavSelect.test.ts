import { describe, test, expect, afterEach } from 'bun:test';
import { type FakeElement, createState, installFakeDocument, installStubQuestionsEditor, readOptionValues, removeFakeState } from './questionQuickNavFakeDom';
import { createQuestionQuickNav } from './questionQuickNav';

function validateChangeMovesToThePickedNameAndResetsTheSelect() {
    installFakeDocument();
    const doc = '{"a": 1, "b": 2}';
    const stub = installStubQuestionsEditor(doc);
    const select = createQuestionQuickNav() as unknown as FakeElement;
    expect(stub.scrolledPositions).toEqual([]);
    select.value = 'b';
    select.listeners.change();
    expect(stub.scrolledPositions).toEqual([doc.indexOf('"b"')]);
    expect(select.value).toBe('');
}

function validateMousedownRebuildsTheOptionsFromTheCurrentEditorText() {
    installFakeDocument();
    const stub = installStubQuestionsEditor('{"a": 1}');
    const select = createQuestionQuickNav() as unknown as FakeElement;
    expect(select.className).toBe('question-quick-nav');
    expect(readOptionValues(select)).toEqual(['', 'a']);
    const placeholder = select.children[0] as FakeElement;
    expect(placeholder.hidden).toBe(true);
    stub.view.state = createState('{"a": 1, "b": {"c": 2}, "d": 3}');
    select.listeners.mousedown();
    expect(readOptionValues(select)).toEqual(['', 'a', 'b', 'd']);
    stub.view.state = createState('{"z": 1}');
    select.listeners.focus();
    expect(readOptionValues(select)).toEqual(['', 'z']);
}

function registerQuestionQuickNavSelectTests() {
    afterEach(removeFakeState);
    test('test_change_moves_to_the_picked_name_and_resets_the_select', validateChangeMovesToThePickedNameAndResetsTheSelect);
    test('test_mousedown_rebuilds_the_options_from_the_current_editor_text', validateMousedownRebuildsTheOptionsFromTheCurrentEditorText);
}

describe('question quick nav select', registerQuestionQuickNavSelectTests);
