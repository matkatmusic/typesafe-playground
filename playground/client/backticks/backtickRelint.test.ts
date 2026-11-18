import { test, expect } from 'bun:test';
import { json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { buildUndefinedNameSource } from './backtickLint';
import { getQuestionsEditorFacet } from '../questions/questionNames';

function createJsonState(text: string): EditorState {
    return EditorState.create({ doc: text, extensions: [json()] });
}

function buildSourceOverStates(states: EditorState[]) {
    function getStates(): EditorState[] {
        return states;
    }
    return buildUndefinedNameSource(getStates);
}

function validateRenamedKeyGetsSquiggleInTheQuestionsEditor() {
    const questionsText = '{"instructions": "Does `message.text` ask the reader to do something?"}';
    const questionsState = createJsonState(questionsText);
    const view = { state: questionsState } as unknown as EditorView;
    const renamedState = createJsonState('{"userMessage": {"text": "Please send me the report by Friday."}}');
    const originalState = createJsonState('{"message": {"text": "Please send me the report by Friday."}}');
    const renamedSource = buildSourceOverStates([renamedState, questionsState]);
    const originalSource = buildSourceOverStates([originalState, questionsState]);
    const nameFrom = questionsText.indexOf('message.text');
    // Updated: messages come from the shared library.
    expect(renamedSource(view)).toEqual([
    // { from: nameFrom, to: nameFrom + 'message.text'.length, severity: 'error', message: 'message.text is not defined in either JSON editor' },
        { from: nameFrom, to: nameFrom + 'message.text'.length, severity: 'error', message: '`message.text` is not in state or in this question' },
    ]);
    expect(originalSource(view)).toEqual([]);
}

function validateArrayIndexNamesAreDefinedOnlyInsideTheArray() {
    const questionsText = '{"q": {"criteria": {"0": "`userMessageArray[0]`", "1": "`userMessageArray[1]`", "x": "`userMessageArray[2]` `q.criteria.0` `userMessageArray.0`"}}}';
    const questionsState = EditorState.create({ doc: questionsText, extensions: [json(), getQuestionsEditorFacet().of(true)] });
    const view = { state: questionsState } as unknown as EditorView;
    const stateState = createJsonState('{"userMessageArray": ["a", "b"]}');
    const diagnostics = buildSourceOverStates([stateState, questionsState])(view);
    const outOfRangeFrom = questionsText.indexOf('userMessageArray[2]');
    const questionPathFrom = questionsText.indexOf('q.criteria.0');
    const dotStepFrom = questionsText.indexOf('userMessageArray.0');
    // Updated: library messages; `q.criteria.0` now errors because names resolve inside question q.
    expect(diagnostics).toEqual([
    // Old: errors on userMessageArray[2] and userMessageArray.0, message '<name> is not defined in either JSON editor'.
        { from: outOfRangeFrom, to: outOfRangeFrom + 'userMessageArray[2]'.length, severity: 'error', message: '`userMessageArray[2]` is not in state or in this question' },
        { from: questionPathFrom, to: questionPathFrom + 'q.criteria.0'.length, severity: 'error', message: '`q.criteria.0` is not in state or in this question' },
        { from: dotStepFrom, to: dotStepFrom + 'userMessageArray.0'.length, severity: 'error', message: '`userMessageArray.0` is not in state or in this question' },
    ]);
}

test('test_array_index_names_are_defined_only_inside_the_array', validateArrayIndexNamesAreDefinedOnlyInsideTheArray);
test('test_renamed_key_gets_squiggle_in_the_questions_editor', validateRenamedKeyGetsSquiggleInTheQuestionsEditor);
