import { test, expect } from 'bun:test'
import { computeKeyPlaceholder, computeShowButtonHidden, hideTypedKey, setKeyPlaceholder, setTypedKeyToVisible, updateShowKeyButton } from './apiKey'

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
}

test('test_placeholder_names_the_env_key_only_when_one_exists', validatePlaceholderNamesTheEnvKeyOnlyWhenOneExists)
test('test_show_button_is_hidden_only_when_the_key_is_empty', validateShowButtonIsHiddenOnlyWhenTheKeyIsEmpty)
test('test_key_dom_functions_throw_without_a_document', validateDomFunctionsThrowWithoutADocument)
