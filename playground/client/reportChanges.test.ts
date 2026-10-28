import { test, expect } from 'bun:test';
import type { Version } from '../playgroundHistory';
import { listChangeBlocks } from './reportChanges';

function buildVersion(extra: Partial<Version>): Version {
  return { id: 1, time: 't', state: {}, questions: {}, calls: 0, outputs: [], ...extra };
}

function validateFirstVersionHasNoChanges() {
  expect(listChangeBlocks(buildVersion({ state: { a: 1 } }), undefined)).toEqual([]);
}

function validateNothingChangedGivesNoBlocks() {
  const before = buildVersion({ state: { a: 1 }, questions: { q: { type: 'noul' } } });
  const after = buildVersion({ state: { a: 1 }, questions: { q: { type: 'noul' } } });
  expect(listChangeBlocks(after, before)).toEqual([]);
}

function validateAddedRemovedAndChangedLeavesAreListed() {
  const before = buildVersion({ state: { gone: 1, same: 2, nested: { x: 'a' } }, questions: { q: { criteria: { 1: 'low', 2: 'high' } } } });
  const after = buildVersion({ state: { same: 2, fresh: 3, nested: { x: 'b' } }, questions: { q: { criteria: { 1: 'changed', 2: 'high' } } } });
  const expected = [
    '- state: `gone` removed',
    '- state: `nested.x` changed',
    '- state: `fresh` added',
    '- questions: `q.criteria.1` changed',
  ].join('\n');
  expect(listChangeBlocks(after, before)).toEqual(['### Changes', expected]);
}

function validateArrayIndexesUseBrackets() {
  const before = buildVersion({ state: { list: [{ a: 1 }, 'x'] } });
  const after = buildVersion({ state: { list: [{ a: 2 }, 'x', 'new'] } });
  const expected = '- state: `list[0].a` changed\n- state: `list[2]` added';
  expect(listChangeBlocks(after, before)).toEqual(['### Changes', expected]);
}

function validateRemovedArrayItemIsListed() {
  const before = buildVersion({ state: { list: ['a', 'b'] } });
  const after = buildVersion({ state: { list: ['a'] } });
  expect(listChangeBlocks(after, before)).toEqual(['### Changes', '- state: `list[1]` removed']);
}

function validateNewSubtreeIsOneBullet() {
  const before = buildVersion({ state: {} });
  const after = buildVersion({ state: { userMessageArray: [{ text: 'a', more: { deep: 1 } }] } });
  expect(listChangeBlocks(after, before)).toEqual(['### Changes', '- state: `userMessageArray` added']);
}

function validateTypeChangeIsOneBullet() {
  const before = buildVersion({ state: { a: { b: 1 } } });
  const after = buildVersion({ state: { a: [1] } });
  expect(listChangeBlocks(after, before)).toEqual(['### Changes', '- state: `a` changed']);
}

test('test_first_version_has_no_changes', validateFirstVersionHasNoChanges);
test('test_nothing_changed_gives_no_blocks', validateNothingChangedGivesNoBlocks);
test('test_added_removed_and_changed_leaves_are_listed', validateAddedRemovedAndChangedLeavesAreListed);
test('test_array_indexes_use_brackets', validateArrayIndexesUseBrackets);
test('test_removed_array_item_is_listed', validateRemovedArrayItemIsListed);
test('test_new_subtree_is_one_bullet', validateNewSubtreeIsOneBullet);
test('test_type_change_is_one_bullet', validateTypeChangeIsOneBullet);
