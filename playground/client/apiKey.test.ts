import { test, expect, afterEach } from 'bun:test'
import { computeKeyPlaceholder, computeShowButtonHidden, hideTypedKey, isKeyMissing, refreshSubmitAvailability, setKeyPlaceholder, setTypedKeyToVisible, SUBMIT_KEY_MESSAGE, updateShowKeyButton } from './apiKey'

class FakeButton { disabled = false }
class FakeInput { value = '' }
class FakeBox { textContent = '' }

function installFakeDom(hasEnvKey: boolean) {
    const elements = { data: new FakeBox(), errorLine: new FakeBox(), submitButton: new FakeButton(), typeSafeKeyEditor: new FakeInput() }
    elements.data.textContent = JSON.stringify({ versions: [], hasEnvKey })
    function getElementById(id: string) {
        return (elements as Record<string, unknown>)[id] ?? null
    }
    Object.assign(globalThis, { document: { getElementById }, HTMLButtonElement: FakeButton, HTMLInputElement: FakeInput })
    return elements
}

function removeFakeDom() {
    Reflect.deleteProperty(globalThis, 'document')
    Reflect.deleteProperty(globalThis, 'HTMLButtonElement')
    Reflect.deleteProperty(globalThis, 'HTMLInputElement')
}

afterEach(removeFakeDom)

function validatePlaceholderNamesTheEnvKeyOnlyWhenOneExists() {
    expect(computeKeyPlaceholder(true)).toBe('Using key from .env')
    expect(computeKeyPlaceholder(false)).toBe('TypeSafe API key')
}

function validateShowButtonIsHiddenOnlyWhenTheKeyIsEmpty() {
    expect(computeShowButtonHidden('')).toBe(true)
    expect(computeShowButtonHidden('a')).toBe(false)
}

function validateDomFunctionsThrowWithoutADocument() {
    expect(() => updateShowKeyButton()).toThrow()
    expect(() => setKeyPlaceholder(true)).toThrow()
    expect(() => hideTypedKey()).toThrow()
    expect(() => setTypedKeyToVisible()).toThrow()
    expect(() => refreshSubmitAvailability()).toThrow()
}

function validateKeyIsMissingOnlyWithNoEnvKeyAndNothingTyped() {
    expect(isKeyMissing(false, '  ')).toBe(true)
    expect(isKeyMissing(false, 'k')).toBe(false)
    expect(isKeyMissing(true, '')).toBe(false)
}

function validateNoKeyDisablesSubmitAndShowsTheMessageUntilAKeyIsTyped() {
    const elements = installFakeDom(false)
    refreshSubmitAvailability()
    expect(elements.submitButton.disabled).toBe(true)
    expect(elements.errorLine.textContent).toBe(SUBMIT_KEY_MESSAGE)
    expect(SUBMIT_KEY_MESSAGE).toBe('Add a TypeSafe API key to submit runs')
    elements.typeSafeKeyEditor.value = 'typed'
    refreshSubmitAvailability()
    expect(elements.submitButton.disabled).toBe(false)
    expect(elements.errorLine.textContent).toBe('')
}

function validateEnvKeyKeepsSubmitEnabled() {
    const elements = installFakeDom(true)
    refreshSubmitAvailability()
    expect(elements.submitButton.disabled).toBe(false)
    expect(elements.errorLine.textContent).toBe('')
}

test('test_placeholder_names_the_env_key_only_when_one_exists', validatePlaceholderNamesTheEnvKeyOnlyWhenOneExists)
test('test_show_button_is_hidden_only_when_the_key_is_empty', validateShowButtonIsHiddenOnlyWhenTheKeyIsEmpty)
test('test_key_dom_functions_throw_without_a_document', validateDomFunctionsThrowWithoutADocument)
test('test_key_is_missing_only_with_no_env_key_and_nothing_typed', validateKeyIsMissingOnlyWithNoEnvKeyAndNothingTyped)
test('test_no_key_disables_submit_and_shows_the_message_until_a_key_is_typed', validateNoKeyDisablesSubmitAndShowsTheMessageUntilAKeyIsTyped)
test('test_env_key_keeps_submit_enabled', validateEnvKeyKeepsSubmitEnabled)
