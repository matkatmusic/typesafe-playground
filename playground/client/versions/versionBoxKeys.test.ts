import { test, expect, afterEach, describe } from 'bun:test';
import { computeArrowStep, isTypingTarget } from './versionBox';
import { removeFakeState } from './versionBoxFakeDom';

class StubElement {
    public seenSelector = '';
    public constructor(private readonly isInside: boolean) {}
    public readonly closest = (selector: string) => {
        this.seenSelector = selector;
        return this.isInside ? this : null;
    };
}

function triggerIsTypingTargetWithNull() {
    isTypingTarget(null);
}

function validateArrowKeysMapToSteps() {
    expect(computeArrowStep('ArrowLeft')).toBe(-1);
    expect(computeArrowStep('ArrowRight')).toBe(1);
    expect(computeArrowStep('ArrowUp')).toBe(0);
}

function validateTypingTargetsAreSkipped() {
    Object.assign(globalThis, { Element: StubElement });
    const idle = new StubElement(false);
    expect(isTypingTarget(new StubElement(true) as unknown as EventTarget)).toBe(true);
    expect(isTypingTarget(idle as unknown as EventTarget)).toBe(false);
    for (const part of ['input', 'textarea', 'select', 'dialog', '.cm-editor'])
        expect(idle.seenSelector.includes(part)).toBe(true);
    expect(triggerIsTypingTargetWithNull).toThrow('keydown target is not an element');
}

function registerKeysTests() {
    afterEach(removeFakeState);
    test('test_arrow_keys_map_to_steps', validateArrowKeysMapToSteps);
    test('test_typing_targets_are_skipped', validateTypingTargetsAreSkipped);
}

describe('versionBox keys', registerKeysTests);
