import { test, expect } from 'bun:test'
import { getButton, getElement, getInput } from './dom'

function validateModuleLoadsWithoutDom() {
    expect(typeof getElement).toBe('function')
    expect(typeof getButton).toBe('function')
}

function validateLookupWithoutDocumentThrows() {
    expect(() => getElement('newButton')).toThrow()
    expect(() => getButton('newButton')).toThrow()
    expect(() => getInput('typeSafeKeyEditor')).toThrow()
}

test('test_dom_module_loads_without_touching_the_dom', validateModuleLoadsWithoutDom)
test('test_lookup_without_a_document_throws', validateLookupWithoutDocumentThrows)
