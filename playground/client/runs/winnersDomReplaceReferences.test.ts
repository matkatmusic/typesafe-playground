import { test, expect } from 'bun:test';
import type { Version } from '../../history/playgroundHistory';
import { graphState } from '../graphs/graphState';
import { createQuestionResultLabel, renderWinners } from './winnersDom';
import { FakeElement, buildNoulOutputs, buildVersion, installFakeDocument, readLineText, removeFakeState } from './winnersDomFakeDom';

function renderReplaceTestLabel(isReferencesReplaced: boolean): FakeElement {
    installFakeDocument();
    graphState.isReferencesReplaced = isReferencesReplaced;
    const questions = { q: { type: 'noul', instructions: 'Is `tone` it?', criteria: { true: 'yes `tone`', false: 'no' } } };
    const version = { ...buildVersion(questions, buildNoulOutputs(0.9)), state: { tone: 'calm' } } as Version;
    const container = new FakeElement();
    renderWinners(version, container as unknown as HTMLElement);
    return container.children[1];
}

function readReplaceTestLines(isReferencesReplaced: boolean): string[] {
    const label = renderReplaceTestLabel(isReferencesReplaced);
    const lines = [readLineText(label.children[0]), readLineText(label.children[1])];
    removeFakeState();
    return lines;
}

function validateReplaceReferencesChangesInstructionsAndWinnerLines() {
    expect(readReplaceTestLines(true)).toEqual(["Is 'calm' it?", "yes 'calm' (1)"]);
}

function validateWinnersTextIsUnchangedWhenReplaceReferencesIsOff() {
    expect(readReplaceTestLines(false)).toEqual(['Is `tone` it?', 'yes `tone` (1)']);
}

function validateBackTickedNamesShowTheReplacedTextInATooltip() {
    const label = renderReplaceTestLabel(false);
    const instructionRef = label.children[0].children[1];
    const winnerRef = label.children[1].children[1];
    expect(instructionRef.className).toBe('backtick-ref');
    expect(instructionRef.textContent).toBe('`tone`');
    expect(instructionRef.title).toBe('');
    expect(typeof instructionRef.listeners.mouseenter).toBe('function');
    expect(winnerRef.className).toBe('backtick-ref');
    expect(winnerRef.title).toBe('');
    expect(typeof winnerRef.listeners.mouseleave).toBe('function');
    removeFakeState();
}

function validateEachWinnerLabelReplacesNamesOnlyFromItsOwnQuestion() {
    // Step: secretWord is only in ownName's own object; crossName uses it too.
    installFakeDocument();
    graphState.isReferencesReplaced = true;
    const questions = {
        ownName: { type: 'noul', instructions: 'Is `secretWord` it?', secretWord: 'banana' },
        crossName: { type: 'noul', instructions: 'Is `secretWord` it?' },
    };
    const outputs = [{ model: 'm', answers: { ownName: { type: 'noul', noul: 0.9 }, crossName: { type: 'noul', noul: 0.9 } }, usage: { input_tokens: 1, output_tokens: 1 } }];
    const container = new FakeElement();
    renderWinners({ ...buildVersion(questions, outputs), state: { fruit: 'apple' } } as Version, container as unknown as HTMLElement);
    // Step: ownName's label gets 'banana'; crossName's label keeps `secretWord`.
    expect(readLineText(container.children[1].children[0])).toBe("Is 'banana' it?");
    expect(readLineText(container.children[2].children[0])).toBe('Is `secretWord` it?');
    removeFakeState();
}

function buildOwnNameQuestion() {
    return { type: 'noul', instructions: { task: 'Is `secretWord` the word banana?', secretWord: 'banana' } } as const;
}

function buildCrossNameQuestion() {
    return { type: 'noul', instructions: 'Is `secretWord` the word banana?' } as const;
}

function buildScopeVersion(): Version {
    const questions = { ownName: buildOwnNameQuestion(), crossName: buildCrossNameQuestion() };
    return { ...buildVersion(questions, []), state: { fruit: 'apple' } } as Version;
}

function formatTextUnchanged(text: string): string {
    return text;
}

function listInstructionRefClasses(question: ReturnType<typeof buildOwnNameQuestion> | ReturnType<typeof buildCrossNameQuestion>): string[] {
    installFakeDocument();
    const label = createQuestionResultLabel(question, [], formatTextUnchanged, buildScopeVersion()) as unknown as FakeElement;
    const classes: string[] = [];
    for (const part of label.children[0].children) {
        classes.push(part.className);
    }
    removeFakeState();
    return classes;
}

function validateCrossNameInstructionsGetNoHoverTextFromAnotherQuestion() {
    // Step: crossName uses secretWord but only ownName declares it.
    const classes = listInstructionRefClasses(buildCrossNameQuestion());
    // Step: the instructions line holds no hover-text span.
    expect(classes).not.toContain('backtick-ref');
}

function validateOwnNameInstructionsGetHoverTextFromTheirOwnQuestion() {
    // Step: ownName declares secretWord in its own instructions.
    const classes = listInstructionRefClasses(buildOwnNameQuestion());
    // Step: the instructions line holds a hover-text span.
    expect(classes).toContain('backtick-ref');
}

test('test_back_ticked_names_show_the_replaced_text_in_a_tooltip', validateBackTickedNamesShowTheReplacedTextInATooltip);
test('test_replace_references_changes_instructions_and_winner_lines', validateReplaceReferencesChangesInstructionsAndWinnerLines);
test('test_winners_text_is_unchanged_when_replace_references_is_off', validateWinnersTextIsUnchangedWhenReplaceReferencesIsOff);
test('test_each_winner_label_replaces_names_only_from_its_own_question', validateEachWinnerLabelReplacesNamesOnlyFromItsOwnQuestion);
test('test_cross_name_instructions_get_no_hover_text_from_another_question', validateCrossNameInstructionsGetNoHoverTextFromAnotherQuestion);
test('test_own_name_instructions_get_hover_text_from_their_own_question', validateOwnNameInstructionsGetHoverTextFromTheirOwnQuestion);
