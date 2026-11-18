import { getLockedButtonIds } from './batchControls';
import { FakeBox, FakeButton, FakeInput } from './submitBatchHarnessShapes';
import type { Harness } from './submitBatchHarnessShapes';

function buildBoxElements(): Record<string, FakeBox> {
    return {
        data: new FakeBox(), errorLine: new FakeBox(), versionLabel: new FakeBox(), costLabel: new FakeBox(), totalCostLabel: new FakeBox(), tokensLabel: new FakeBox(), lastEditedLabel: new FakeBox(),
        graphContainerBox: new FakeBox(), winnerBox: new FakeBox(),
    };
}

function buildInputElements(): Record<string, FakeInput> {
    return {
        batchCheckbox: new FakeInput(), typeSafeKeyEditor: new FakeInput(), providerSwitch: new FakeInput(), noteText: new FakeInput(), callsPicker: new FakeInput(),
    };
}

function buildButtonElements(): Record<string, FakeButton> {
    const buttonIds = [...getLockedButtonIds(), 'resetButton', 'submitButton', 'prevVersionButton', 'nextVersionButton', 'deleteVersionButton', 'pinButton', 'unpinButton'];
    const buttons: Record<string, FakeButton> = {};
    for (const id of buttonIds)
        buttons[id] = new FakeButton();
    return buttons;
}

export function createElements(hasEnvKey: boolean): Harness['elements'] {
    const elements = { ...buildBoxElements(), ...buildInputElements(), ...buildButtonElements() } as unknown as Harness['elements'];
    elements.data.textContent = JSON.stringify({ versions: [], hasEnvKey });
    elements.callsPicker.value = '3';
    elements.batchCheckbox.checked = true;
    return elements;
}

export function installDocumentGlobals(elements: Harness['elements']): void {
    Object.assign(globalThis, { document: { getElementById: (id: string) => elements[id] ?? null }, HTMLButtonElement: FakeButton, HTMLInputElement: FakeInput, HTMLTextAreaElement: FakeInput });
}
