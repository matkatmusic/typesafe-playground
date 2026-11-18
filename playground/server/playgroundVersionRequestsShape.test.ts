import { test, expect } from 'bun:test';
import { isPlainObject, isVersionShape } from './playgroundVersionRequests';
import { getOpenedVersion } from './playgroundVersionRequestsSupport';

function validateIsPlainObject() {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject('x')).toBe(false);
}

function validateIsVersionShape() {
    const good = { time: 't', state: {}, questions: {}, calls: 0, outputs: [] };
    expect(isVersionShape(good)).toBe(true);
    expect(isVersionShape({ ...good, state: [] })).toBe(false);
    expect(isVersionShape({ ...good, questions: null })).toBe(false);
    expect(isVersionShape({ ...good, calls: '0' })).toBe(false);
    expect(isVersionShape({ ...good, outputs: {} })).toBe(false);
    expect(isVersionShape('version')).toBe(false);
}

function validateVersionWithoutIdPassesIsVersionShape() {
    expect('id' in getOpenedVersion()).toBe(false);
    expect(isVersionShape(getOpenedVersion())).toBe(true);
}

test('test_is_plain_object_rejects_arrays_and_null', validateIsPlainObject);
test('test_is_version_shape_checks_every_field', validateIsVersionShape);
test('test_a_version_without_id_passes_is_version_shape', validateVersionWithoutIdPassesIsVersionShape);
