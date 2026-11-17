import { test, expect, afterEach } from 'bun:test'
import { clearTypedKey, computeKeyPlaceholder, computeShowButtonHidden, computeSubmitKeyMessage, hideTypedKey, isKeyMissing, readProvider, refreshKeyTexts, refreshProviderSwitch, refreshSubmitAvailability, setKeyPlaceholder, setTypedKeyToVisible, SUBMIT_KEY_MESSAGE, updateShowKeyButton } from './apiKey'

class FakeButton { disabled = false; hidden = false }
class FakeInput { value = ''; disabled = false; checked = false }
class FakeBox { textContent = '' }

function installFakeDom(hasEnvKey: boolean, hasSubqEnvKey = false) {
    const elements = { data: new FakeBox(), errorLine: new FakeBox(), submitButton: new FakeButton(), typeSafeKeyEditor: new FakeInput(), providerSwitch: new FakeInput(), typeSafeKeyLabel: new FakeBox(), showKeyButton: new FakeButton() }
    elements.data.textContent = JSON.stringify({ versions: [], hasEnvKey, hasSubqEnvKey })
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
    expect(computeKeyPlaceholder(true, 'TypeSafe')).toBe('Using key from .env')
    expect(computeKeyPlaceholder(false, 'TypeSafe')).toBe('TypeSafe API key')
    expect(computeKeyPlaceholder(false, 'SubQ')).toBe('SubQ API key')
}

function validateSubmitKeyMessageNamesTheProvider() {
    expect(computeSubmitKeyMessage('TypeSafe')).toBe('Add a TypeSafe API key to submit runs')
    expect(computeSubmitKeyMessage('SubQ')).toBe('Add a SubQ API key to submit runs')
}

function validateKeyTextsFollowTheSwitch() {
    const elements = installFakeDom(false, false)
    refreshKeyTexts()
    expect(elements.typeSafeKeyLabel.textContent).toBe('TypeSafe API key')
    expect((elements.typeSafeKeyEditor as FakeInput & { placeholder: string }).placeholder).toBe('TypeSafe API key')
    elements.providerSwitch.checked = true
    refreshKeyTexts()
    expect(elements.typeSafeKeyLabel.textContent).toBe('SubQ API key')
    expect((elements.typeSafeKeyEditor as FakeInput & { placeholder: string }).placeholder).toBe('SubQ API key')
}

function validateSubqEnvKeyPlaceholderStillNamesTheEnvKey() {
    const elements = installFakeDom(false, true)
    elements.providerSwitch.checked = true
    refreshKeyTexts()
    expect(elements.typeSafeKeyLabel.textContent).toBe('SubQ API key')
    expect((elements.typeSafeKeyEditor as FakeInput & { placeholder: string }).placeholder).toBe('Using key from .env')
}

function validateTurningTheSwitchClearsTheTypedKeyAndHidesTheShowButton() {
    const elements = installFakeDom(false, true)
    elements.typeSafeKeyEditor.value = 'typed'
    elements.showKeyButton.hidden = false
    elements.providerSwitch.checked = true
    clearTypedKey()
    expect(elements.typeSafeKeyEditor.value).toBe('')
    expect(elements.showKeyButton.hidden).toBe(true)
    refreshSubmitAvailability()
    expect(elements.submitButton.disabled).toBe(false)
}

function validateMissingKeyMessageNamesTheSubqProvider() {
    const elements = installFakeDom(false, false)
    elements.providerSwitch.checked = true
    refreshSubmitAvailability()
    expect(elements.errorLine.textContent).toBe('Add a SubQ API key to submit runs')
}

function validateShowButtonIsHiddenOnlyWhenTheKeyIsEmpty() {
    expect(computeShowButtonHidden('')).toBe(true)
    expect(computeShowButtonHidden('a')).toBe(false)
}

function validateDomFunctionsThrowWithoutADocument() {
    expect(() => updateShowKeyButton()).toThrow()
    expect(() => setKeyPlaceholder(true, 'TypeSafe')).toThrow()
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

function validateProviderIsTypeSafeWhenOffAndSubqWhenOn() {
    const elements = installFakeDom(false)
    expect(readProvider()).toBe('TypeSafe')
    elements.providerSwitch.checked = true
    expect(readProvider()).toBe('SubQ')
}

function validateSwitchIsEnabledOnlyWhenTheSubqEnvKeyExists() {
    const withoutKey = installFakeDom(false, false)
    refreshProviderSwitch()
    expect(withoutKey.providerSwitch.disabled).toBe(true)
    const withKey = installFakeDom(false, true)
    refreshProviderSwitch()
    expect(withKey.providerSwitch.disabled).toBe(false)
}

function validateSubqKeepsSubmitEnabledWithAnEmptyKeyField() {
    const elements = installFakeDom(false, true)
    elements.providerSwitch.checked = true
    refreshSubmitAvailability()
    expect(elements.submitButton.disabled).toBe(false)
    expect(elements.errorLine.textContent).toBe('')
}

function validateTypeSafeStillNeedsAKeyWhenTheSubqEnvKeyExists() {
    const elements = installFakeDom(false, true)
    refreshSubmitAvailability()
    expect(elements.submitButton.disabled).toBe(true)
    expect(elements.errorLine.textContent).toBe(SUBMIT_KEY_MESSAGE)
}

test('test_submit_key_message_names_the_provider', validateSubmitKeyMessageNamesTheProvider)
test('test_turning_the_switch_clears_the_typed_key_and_hides_the_show_button', validateTurningTheSwitchClearsTheTypedKeyAndHidesTheShowButton)
test('test_key_texts_follow_the_switch', validateKeyTextsFollowTheSwitch)
test('test_subq_env_key_placeholder_still_names_the_env_key', validateSubqEnvKeyPlaceholderStillNamesTheEnvKey)
test('test_missing_key_message_names_the_subq_provider', validateMissingKeyMessageNamesTheSubqProvider)
test('test_provider_is_typesafe_when_off_and_subq_when_on', validateProviderIsTypeSafeWhenOffAndSubqWhenOn)
test('test_switch_is_enabled_only_when_the_subq_env_key_exists', validateSwitchIsEnabledOnlyWhenTheSubqEnvKeyExists)
test('test_subq_keeps_submit_enabled_with_an_empty_key_field', validateSubqKeepsSubmitEnabledWithAnEmptyKeyField)
test('test_typesafe_still_needs_a_key_when_the_subq_env_key_exists', validateTypeSafeStillNeedsAKeyWhenTheSubqEnvKeyExists)
test('test_placeholder_names_the_env_key_only_when_one_exists', validatePlaceholderNamesTheEnvKeyOnlyWhenOneExists)
test('test_show_button_is_hidden_only_when_the_key_is_empty', validateShowButtonIsHiddenOnlyWhenTheKeyIsEmpty)
test('test_key_dom_functions_throw_without_a_document', validateDomFunctionsThrowWithoutADocument)
test('test_key_is_missing_only_with_no_env_key_and_nothing_typed', validateKeyIsMissingOnlyWithNoEnvKeyAndNothingTyped)
test('test_no_key_disables_submit_and_shows_the_message_until_a_key_is_typed', validateNoKeyDisablesSubmitAndShowsTheMessageUntilAKeyIsTyped)
test('test_env_key_keeps_submit_enabled', validateEnvKeyKeepsSubmitEnabled)
