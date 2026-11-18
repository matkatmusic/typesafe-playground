import { test, expect } from 'bun:test';
import type { Answer } from '../graphs/graphTypes';
import { createQuestionResultLabel, renderWinners } from './winnersDom';
import { FakeElement, getNoulQuestions, buildNoulOutputs, buildVersion, installFakeDocument, readLineText, removeFakeState } from './winnersDomFakeDom';

function getTextUnchanged(text: string): string {
    return text;
}

function validateLabelHoldsInstructionsThenOneLinePerGroup() {
    installFakeDocument();
    const answers: Answer[] = [{ type: 'noul', noul: 0.9 }, { type: 'noul', noul: 0.1 }];
    const label = createQuestionResultLabel({ type: 'noul', instructions: 'Is it?', criteria: { true: 'yes!', false: 'no!' } }, answers, getTextUnchanged, buildVersion({}, [])) as unknown as FakeElement;
    expect(label.children.length).toBe(3);
    expect(readLineText(label.children[0])).toBe('Is it?');
    expect(label.children[0].className).toBe('winner-instructions');
    expect(readLineText(label.children[1])).toBe('yes! (1)');
    expect(label.children[1].className).toBe('winner-line');
    expect(readLineText(label.children[2])).toBe('no! (2)');
    removeFakeState();
}

function validateRenderShowsTitleThenOneLabelPerQuestion() {
    installFakeDocument();
    const container = new FakeElement();
    container.appendChild(new FakeElement());
    const version = buildVersion(getNoulQuestions(), buildNoulOutputs(0.9, 0.2, 0.8));
    renderWinners(version, container as unknown as HTMLElement);
    expect(container.children.length).toBe(2);
    expect(container.children[0].id).toBe('winnerLabel');
    expect(container.children[0].textContent).toBe('Winners:');
    expect(readLineText(container.children[1].children[1])).toBe('yes! (1,3)');
    expect(readLineText(container.children[1].children[2])).toBe('no! (2)');
    removeFakeState();
}

function validateRenderTwiceKeepsOneTitle() {
    installFakeDocument();
    const container = new FakeElement();
    const version = buildVersion(getNoulQuestions(), buildNoulOutputs(0.9));
    renderWinners(version, container as unknown as HTMLElement);
    renderWinners(version, container as unknown as HTMLElement);
    expect(container.children.length).toBe(2);
    removeFakeState();
}

function validateRenderSkipsQuestionsWithoutOutputs() {
    installFakeDocument();
    const container = new FakeElement();
    renderWinners(buildVersion(getNoulQuestions(), []), container as unknown as HTMLElement);
    expect(container.children.length).toBe(1);
    expect(container.children[0].textContent).toBe('Winners:');
    removeFakeState();
}

test('test_label_holds_instructions_then_one_line_per_group', validateLabelHoldsInstructionsThenOneLinePerGroup);
test('test_render_shows_title_then_one_label_per_question', validateRenderShowsTitleThenOneLabelPerQuestion);
test('test_render_twice_keeps_one_title', validateRenderTwiceKeepsOneTitle);
test('test_render_skips_questions_without_outputs', validateRenderSkipsQuestionsWithoutOutputs);
