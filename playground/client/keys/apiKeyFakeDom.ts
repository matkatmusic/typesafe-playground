export class FakeButton {
    public disabled = false; public hidden = false;
}
export class FakeInput {
    public value = ''; public disabled = false; public checked = false;
}
export class FakeBox {
    public textContent = '';
}

export function installFakeDom(hasEnvKey: boolean, hasSubqEnvKey = false) {
    const elements = { data: new FakeBox(), errorLine: new FakeBox(), submitButton: new FakeButton(), typeSafeKeyEditor: new FakeInput(), providerSwitch: new FakeInput(), typeSafeKeyLabel: new FakeBox(), showKeyButton: new FakeButton() };
    elements.data.textContent = JSON.stringify({ versions: [], hasEnvKey, hasSubqEnvKey });
    function getElementById(id: string) {
        return (elements as Record<string, unknown>)[id] ?? null;
    }
    Object.assign(globalThis, { document: { getElementById }, HTMLButtonElement: FakeButton, HTMLInputElement: FakeInput });
    return elements;
}

export function removeFakeDom() {
    Reflect.deleteProperty(globalThis, 'document');
    Reflect.deleteProperty(globalThis, 'HTMLButtonElement');
    Reflect.deleteProperty(globalThis, 'HTMLInputElement');
}
