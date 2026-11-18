import { getQuestions } from './submitBatchHarness.test';
import type { Harness } from './submitBatchHarness.test';

export type Runs = Harness['runs'];

export function getRunIndexes(runs: Runs): number[] {
    const indexes: number[] = [];
    for (const run of runs) {
        indexes.push(run.index);
    }
    return indexes;
}

export function getRunStates(runs: Runs): unknown[] {
    const states: unknown[] = [];
    for (const run of runs) {
        states.push(run.state);
    }
    return states;
}

export function getRunCalls(runs: Runs): number[] {
    const calls: number[] = [];
    for (const run of runs) {
        calls.push(run.calls);
    }
    return calls;
}

export function getRunButtonTexts(runs: Runs): string[] {
    const buttonTexts: string[] = [];
    for (const run of runs) {
        buttonTexts.push(run.buttonText);
    }
    return buttonTexts;
}

export function isEveryRunUsingTheQuestions(runs: Runs): boolean {
    for (const run of runs) {
        const isSameQuestions = JSON.stringify(run.questions) === JSON.stringify(getQuestions());
        if (!isSameQuestions) {
            return false;
        }
    }
    return true;
}

function isRunLockingTheControls(run: Runs[number]): boolean {
    if (!run.isButtonDisabled) {
        return false;
    }
    if (!run.isToggleDisabled) {
        return false;
    }
    if (!run.isNewDisabled) {
        return false;
    }
    return run.areEditorsLocked;
}

export function isEveryRunLockingTheControls(runs: Runs): boolean {
    for (const run of runs) {
        const isLocking = isRunLockingTheControls(run);
        if (!isLocking) {
            return false;
        }
    }
    return true;
}

export function isEveryRunShowingIndex(runs: Runs, shownIndex: number): boolean {
    for (const run of runs) {
        const isShowingIndex = run.shownIndex === shownIndex;
        if (!isShowingIndex) {
            return false;
        }
    }
    return true;
}
