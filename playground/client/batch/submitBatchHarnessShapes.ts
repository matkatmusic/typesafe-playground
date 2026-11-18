import type { Version } from '../../history/playgroundHistory';
import { getSubmitText } from '../runs/submit';

export class FakeButton {
    public disabled = false;
    public textContent = getSubmitText();
}
export class FakeInput {
    public value = '';
    public type = 'password';
    public checked = false;
    public disabled = false;
    public placeholder = '';
}
export class FakeBox {
    public textContent = '';
}

export interface RunSnapshot { index: number; calls: number; state: unknown; questions: unknown; buttonText: string; isButtonDisabled: boolean; isToggleDisabled: boolean; isNewDisabled: boolean; areEditorsLocked: boolean; shownIndex: number }
export interface Harness { elements: Record<string, FakeButton & FakeInput & FakeBox>; history: Version[]; runs: RunSnapshot[]; notes: { index: number; body: Record<string, unknown> }[]; drafts: Record<string, unknown>[]; alerts: string[]; openBodies: Version[][]; locks: boolean[]; stateText: { value: string }; questionsText: { value: string }; fetchOrder: string[] }
export interface FetchBody extends Record<string, unknown> { index: number; calls: number; state: unknown; questions: unknown; versions: Version[]; questionsNote: Version['questionsNote'] }

export function getOutput() {
    return { answers: {}, usage: { input_tokens: 1000000, output_tokens: 1 } };
}
