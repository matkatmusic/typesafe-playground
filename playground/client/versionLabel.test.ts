import { test, expect } from 'bun:test'
import type { Version } from '../playgroundHistory'
import { computeWrappedIndex, createEditedVersion, formatVersionLabel, isStateEdited, NOT_RUN_TIME } from './versionLabel'

const ISO_TIME = '2026-03-04T05:06:07.000Z'
const version: Version ={ id: 2, time: 'now', state: { a: 1 }, questions: {}, calls: 1, outputs: [] }

function validateEditDetectionComparesParsedState() {
    expect(isStateEdited(JSON.stringify(version.state, null, 2), version)).toBe(false)
    expect(isStateEdited('{ "a":   1 }', version)).toBe(false)
    expect(isStateEdited('{"a":2}', version)).toBe(true)
    expect(isStateEdited('{"a":', version)).toBe(true)
}

function validateEditedVersionHasNoRun() {
    const edited = createEditedVersion({ ...version, outputs: [{} as never] }, 5)
    expect(edited.id).toBe(6)
    expect(edited.time).toBe(NOT_RUN_TIME)
    expect(edited.outputs).toEqual([])
    expect(edited.calls).toBe(0)
    expect(edited.state).toEqual(version.state)
}

function validateLabelText() {
    const localTime = new Date(ISO_TIME).toLocaleString()
    expect(formatVersionLabel(2, 3, ISO_TIME, 1)).toBe(`version 2 of 3 · ${localTime} · 1 call`)
    expect(formatVersionLabel(4, 4, NOT_RUN_TIME, 0)).toBe('version 4 of 4 · not run yet · 0 calls')
    expect(formatVersionLabel(1, 1, ISO_TIME, 5)).toBe(`version 1 of 1 · ${localTime} · 5 calls`)
}

function validateIndexWrapsBothWays() {
    expect(computeWrappedIndex(0, -1, 3)).toBe(2)
    expect(computeWrappedIndex(2, 1, 3)).toBe(0)
    expect(computeWrappedIndex(1, 1, 3)).toBe(2)
    expect(computeWrappedIndex(0, 1, 1)).toBe(0)
    expect(computeWrappedIndex(0, -1, 1)).toBe(0)
}

test('test_edit_detection_compares_parsed_state', validateEditDetectionComparesParsedState)
test('test_edited_version_has_no_run', validateEditedVersionHasNoRun)
test('test_label_text', validateLabelText)
test('test_index_wraps_both_ways', validateIndexWrapsBothWays)
