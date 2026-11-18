import { test, expect } from 'bun:test';
import { getSubmitText } from '../runs/submit';
import { FakeBox, FakeButton, FakeInput, getOutput } from './submitBatchHarnessShapes';

function validateFakeButtonStartsEnabledWithSubmitText() {
    // Step: make a fake button.
    const button = new FakeButton();
    // Step: it is enabled and shows the submit text.
    expect(button.disabled).toBe(false);
    expect(button.textContent).toBe(getSubmitText());
}

function validateFakeInputStartsAsEmptyPasswordInput() {
    // Step: make a fake input.
    const input = new FakeInput();
    // Step: every field holds its starting value.
    expect(input.value).toBe('');
    expect(input.type).toBe('password');
    expect(input.checked).toBe(false);
    expect(input.disabled).toBe(false);
    expect(input.placeholder).toBe('');
}

function validateFakeBoxStartsWithEmptyText() {
    // Step: make a fake box.
    const box = new FakeBox();
    // Step: its text is empty.
    expect(box.textContent).toBe('');
}

function validateGetOutputReturnsEmptyAnswersAndFixedUsage() {
    // Step: ask for the fake output.
    const output = getOutput();
    // Step: answers are empty and usage holds the fixed token counts.
    expect(output.answers).toEqual({});
    expect(output.usage).toEqual({ input_tokens: 1000000, output_tokens: 1 });
}

test('FakeButton starts enabled with the submit text', validateFakeButtonStartsEnabledWithSubmitText);
test('FakeInput starts as an empty, unchecked, enabled password input', validateFakeInputStartsAsEmptyPasswordInput);
test('FakeBox starts with empty text', validateFakeBoxStartsWithEmptyText);
test('getOutput returns empty answers and fixed token counts', validateGetOutputReturnsEmptyAnswersAndFixedUsage);
