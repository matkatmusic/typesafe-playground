import { test, expect } from 'bun:test'
import { computeUnsavedStep, readUnsavedChoice } from './unsavedDialog'

function validateEachChoiceMapsToOneStep() {
    expect(computeUnsavedStep('save')).toBe('save')
    expect(computeUnsavedStep('discard')).toBe('continue')
    expect(computeUnsavedStep('cancel')).toBe('stop')
}

function validateUnknownChoiceThrows() {
    expect(() => computeUnsavedStep('')).toThrow()
    expect(() => computeUnsavedStep('maybe')).toThrow()
}

function validateReadChoiceWithoutDocumentThrows() {
    expect(() => readUnsavedChoice()).toThrow()
}

test('test_each_unsaved_choice_maps_to_one_step', validateEachChoiceMapsToOneStep)
test('test_unknown_unsaved_choice_throws', validateUnknownChoiceThrows)
test('test_read_choice_without_a_document_throws', validateReadChoiceWithoutDocumentThrows)
