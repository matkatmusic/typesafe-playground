import { test, expect } from 'bun:test'
import type { Version } from '../playgroundHistory'
import { findPinned, readPinnedData, readPinnedValues } from './pinned'

function buildVersion(id: number, outputs: unknown[]): Version {
  return { id, time: 't', state: {}, questions: {}, calls: outputs.length, outputs: outputs as Version['outputs'] }
}

const noulOutput = { answers: { q: { type: 'noul', noul: 0.8 } } }

function validateFindPinnedMatchesById() {
  const versions = [buildVersion(1, []), buildVersion(2, [])]
  expect(findPinned(versions, 2)).toBe(versions[1])
  expect(findPinned(versions, null)).toBeNull()
  expect(findPinned(versions, 9)).toBeNull()
}

function validateReadPinnedDataNeedsRunsAndTheQuestion() {
  expect(readPinnedData(null, 'q')).toBeNull()
  expect(readPinnedData(buildVersion(1, []), 'q')).toBeNull()
  expect(readPinnedData(buildVersion(1, [noulOutput]), 'other')).toBeNull()
  const data = readPinnedData(buildVersion(3, [noulOutput, noulOutput]), 'q')
  expect(data?.id).toBe(3)
  expect(data?.keys).toEqual(['yes'])
  expect(data?.answers.length).toBe(2)
}

function validateReadPinnedValuesNeedsTheKey() {
  const data = readPinnedData(buildVersion(3, [noulOutput, noulOutput]), 'q')
  expect(readPinnedValues(null, 'yes')).toBeNull()
  expect(readPinnedValues(data, 'no')).toBeNull()
  expect(readPinnedValues(data, 'yes')).toEqual({ id: 3, values: [0.8, 0.8] })
}

test('test_find_pinned_matches_by_id', validateFindPinnedMatchesById)
test('test_read_pinned_data_needs_runs_and_the_question', validateReadPinnedDataNeedsRunsAndTheQuestion)
test('test_read_pinned_values_needs_the_key', validateReadPinnedValuesNeedsTheKey)
