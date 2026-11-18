import { spyOn, mock } from 'bun:test';
import type { EditorView } from '@codemirror/view';
import type { Version } from '../../history/playgroundHistory';
import * as editors from '../editors/editors';
import { getLockedButtonIds } from './batchControls';
import { pageState } from '../page/state';
import { getSubmitText } from '../runs/submit';

class FakeButton {
    public disabled = false;
    public textContent = getSubmitText();
}
class FakeInput {
    public value = '';
    public type = 'password';
    public checked = false;
    public disabled = false;
    public placeholder = '';
}
class FakeBox {
    public textContent = '';
}

function buildResultOutput() {
    return { usage: { input_tokens: 1, output_tokens: 1 } };
}
export function getVersionWithResults(): Version {
    return { time: 't', state: { a: 1 }, questions: {}, calls: 1, outputs: [buildResultOutput()] } as unknown as Version;
}
export function getVersionTwo(): Version {
    return { time: 't', state: { a: 2 }, questions: {}, calls: 1, outputs: [buildResultOutput()] } as unknown as Version;
}
export function getNormalStateText(): string {
    return '{"a":1}';
}
export function getBatchOnDisabledIds(): string[] {
    return ['saveButton', 'prevVersionButton', 'nextVersionButton', 'newButton', 'openButton', 'resetButton', 'reportButton', 'deleteVersionButton', 'resetRunsButton', 'pinButton', 'unpinButton', 'noteText', 'stateNotesButton', 'questionsNotesButton'];
}
class DispatchedSpecsHolder {
    private static instance: DispatchedSpecsHolder | null = null;
    public specs: unknown[] = [];
    private constructor() {}
    public static getInstance(): DispatchedSpecsHolder {
        if (DispatchedSpecsHolder.instance === null) {
            DispatchedSpecsHolder.instance = new DispatchedSpecsHolder();
        }
        return DispatchedSpecsHolder.instance;
    }
}
export function getDispatchedSpecs(): unknown[] {
    return DispatchedSpecsHolder.getInstance().specs;
}

export function installFakeDom(hasEnvKey: boolean) {
    const elements: Record<string, unknown> = {
        data: new FakeBox(), errorLine: new FakeBox(), versionLabel: new FakeBox(),
        batchCheckbox: new FakeInput(), typeSafeKeyEditor: new FakeInput(), providerSwitch: new FakeInput(), noteText: new FakeInput(),
    };
    const buttonIds = [...getLockedButtonIds(), 'resetButton', 'submitButton', 'prevVersionButton', 'nextVersionButton', 'deleteVersionButton', 'pinButton', 'unpinButton'];
    for (const id of buttonIds) {
        elements[id] = new FakeButton();
    }
    (elements.data as FakeBox).textContent = JSON.stringify({ versions: [], hasEnvKey });
    Object.assign(globalThis, { document: { getElementById: (id: string) => elements[id] ?? null }, HTMLButtonElement: FakeButton, HTMLInputElement: FakeInput, HTMLTextAreaElement: FakeInput });
    return elements as Record<string, FakeButton & FakeInput & FakeBox>;
}

function buildStubEditor(text: string) {
    return { state: { doc: { toString: () => text } }, dispatch: (spec: unknown) => getDispatchedSpecs().push(spec) } as unknown as EditorView;
}

export function installStubEditors(stateText: string) {
    spyOn(editors, 'getStateEditor').mockReturnValue(buildStubEditor(stateText));
    spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildStubEditor('{}'));
}

export function resetFakeDomAndPageState() {
    mock.restore();
    for (const name of ['document', 'HTMLButtonElement', 'HTMLInputElement', 'HTMLTextAreaElement']) {
        Reflect.deleteProperty(globalThis, name);
    }
    pageState.versions = [];
    pageState.index = 0;
    pageState.isBatchOn = false;
    pageState.batchRun = null;
    pageState.fileHandle = null;
    pageState.pinnedIndex = null;
    getDispatchedSpecs().length = 0;
}

export function listEnabled(elements: Record<string, FakeButton>, ids: string[]): string[] {
    const enabledIds: string[] = [];
    for (const id of ids) {
        const isEnabled = !elements[id].disabled;
        if (isEnabled) {
            enabledIds.push(id);
        }
    }
    return enabledIds;
}
