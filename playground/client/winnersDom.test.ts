import { test, expect, afterEach } from 'bun:test';
import type { Version } from '../playgroundHistory';
import type { Answer } from './graphTypes';
import { graphState } from './graphState';
import { createQuestionResultLabel, renderWinners } from './winnersDom';

class FakeElement {
  id = '';
  className = '';
  textContent = '';
  title = '';
  children: FakeElement[] = [];
  appendChild(child: FakeElement) { this.children.push(child); }
  replaceChildren(...nodes: FakeElement[]) { this.children = nodes; }
}

function createFakeText(text: string) {
  const element = new FakeElement();
  element.textContent = text;
  return element;
}

function installFakeDocument() {
  Object.assign(globalThis, { document: { createElement: () => new FakeElement(), createTextNode: createFakeText } });
}

function removeFakeDocument() {
  Reflect.deleteProperty(globalThis, 'document');
}

function readLineText(line: FakeElement): string {
  let text = '';
  for (const part of line.children)
    text += part.textContent;
  return text;
}

function buildVersion(questions: unknown, outputs: unknown[]): Version {
  return { id: 1, time: 't', state: {}, questions, calls: outputs.length, outputs } as Version;
}

const NOUL_QUESTIONS = { q: { type: 'noul', instructions: 'Is it?', criteria: { true: 'yes!', false: 'no!' } } };

function buildNoulOutputs(...noulValues: number[]) {
  const outputs = [];
  for (const noul of noulValues)
    outputs.push({ model: 'm', answers: { q: { type: 'noul', noul } }, usage: { input_tokens: 1, output_tokens: 1 } });
  return outputs;
}

function validateLabelHoldsInstructionsThenOneLinePerGroup() {
  installFakeDocument();
  const answers: Answer[] = [{ type: 'noul', noul: 0.9 }, { type: 'noul', noul: 0.1 }];
  const label = createQuestionResultLabel({ type: 'noul', instructions: 'Is it?', criteria: { true: 'yes!', false: 'no!' } }, answers, (text) => text, buildVersion({}, [])) as unknown as FakeElement;
  expect(label.children.length).toBe(3);
  expect(readLineText(label.children[0])).toBe('Is it?');
  expect(label.children[0].className).toBe('winner-instructions');
  expect(readLineText(label.children[1])).toBe('yes! (1)');
  expect(label.children[1].className).toBe('winner-line');
  expect(readLineText(label.children[2])).toBe('no! (2)');
}

function validateRenderShowsTitleThenOneLabelPerQuestion() {
  installFakeDocument();
  const container = new FakeElement();
  container.appendChild(new FakeElement());
  const version = buildVersion(NOUL_QUESTIONS, buildNoulOutputs(0.9, 0.2, 0.8));
  renderWinners(version, container as unknown as HTMLElement);
  expect(container.children.length).toBe(2);
  expect(container.children[0].id).toBe('winnerLabel');
  expect(container.children[0].textContent).toBe('Winners:');
  expect(readLineText(container.children[1].children[1])).toBe('yes! (1,3)');
  expect(readLineText(container.children[1].children[2])).toBe('no! (2)');
}

function validateRenderTwiceKeepsOneTitle() {
  installFakeDocument();
  const container = new FakeElement();
  const version = buildVersion(NOUL_QUESTIONS, buildNoulOutputs(0.9));
  renderWinners(version, container as unknown as HTMLElement);
  renderWinners(version, container as unknown as HTMLElement);
  expect(container.children.length).toBe(2);
}

function validateRenderSkipsQuestionsWithoutOutputs() {
  installFakeDocument();
  const container = new FakeElement();
  renderWinners(buildVersion(NOUL_QUESTIONS, []), container as unknown as HTMLElement);
  expect(container.children.length).toBe(1);
  expect(container.children[0].textContent).toBe('Winners:');
}

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
  return [readLineText(label.children[0]), readLineText(label.children[1])];
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
  expect(instructionRef.title).toBe("'calm'");
  expect(winnerRef.className).toBe('backtick-ref');
  expect(winnerRef.title).toBe("'calm'");
}

function removeFakeState() {
  removeFakeDocument();
  graphState.isReferencesReplaced = false;
}

afterEach(removeFakeState);
test('test_back_ticked_names_show_the_replaced_text_in_a_tooltip', validateBackTickedNamesShowTheReplacedTextInATooltip);
test('test_replace_references_changes_instructions_and_winner_lines', validateReplaceReferencesChangesInstructionsAndWinnerLines);
test('test_winners_text_is_unchanged_when_replace_references_is_off', validateWinnersTextIsUnchangedWhenReplaceReferencesIsOff);
test('test_label_holds_instructions_then_one_line_per_group', validateLabelHoldsInstructionsThenOneLinePerGroup);
test('test_render_shows_title_then_one_label_per_question', validateRenderShowsTitleThenOneLabelPerQuestion);
test('test_render_twice_keeps_one_title', validateRenderTwiceKeepsOneTitle);
test('test_render_skips_questions_without_outputs', validateRenderSkipsQuestionsWithoutOutputs);
