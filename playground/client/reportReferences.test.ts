import { test, expect } from 'bun:test';
import type { Version } from '../playgroundHistory';
import { buildReportMarkdown } from './reportMarkdown';
import { replaceVersionReferences } from './reportReferences';

const LONG_TEXT = 'a value that is longer than forty characters in total';

function buildVersion(id: number, extra: Partial<Version>): Version {
  return { id, time: `t${id}`, state: {}, questions: {}, calls: 0, outputs: [], ...extra };
}

function validateShortValueIsReplaced() {
  const version = buildVersion(1, { state: { name: 'Ann' } });
  expect(replaceVersionReferences(['hi `name`'], version)).toEqual(["hi 'Ann'"]);
}

function validateQuestionsAreUsedAfterState() {
  const version = buildVersion(1, { state: { a: 'S' }, questions: { a: 'Q', b: ['x', 'y'] } });
  expect(replaceVersionReferences(['`a` `b[1]`'], version)).toEqual(["'S' 'y'"]);
}

function validateLongValueIsKeptAndDefined() {
  const version = buildVersion(1, { state: { big: LONG_TEXT } });
  const blocks = replaceVersionReferences(['see `big`'], version);
  expect(blocks).toEqual(['see `big`', '### References', `| Name | Value |\n|---|---|\n| \`big\` | '${LONG_TEXT}' |`]);
}

function validateMultiLineValueUsesSpaces() {
  const version = buildVersion(1, { state: { poem: 'one\ntwo' } });
  const blocks = replaceVersionReferences(['`poem`'], version);
  expect(blocks[0]).toBe('`poem`');
  expect(blocks[2]).toContain("| `poem` | 'one two' |");
}

function validatePipeIsEscaped() {
  const version = buildVersion(1, { state: { code: `${LONG_TEXT} a|b` } });
  const blocks = replaceVersionReferences(['`code`'], version);
  expect(blocks[2]).toContain('a\\|b');
}

function validateSameNameGivesOneRow() {
  const version = buildVersion(1, { state: { big: LONG_TEXT, other: `${LONG_TEXT} 2` } });
  const blocks = replaceVersionReferences(['`big` `other`', '`big`'], version);
  const rows = blocks[blocks.length - 1].split('\n');
  expect(rows).toHaveLength(4);
  expect(rows[2]).toContain('`big`');
  expect(rows[3]).toContain('`other`');
}

function validateMissingNameIsLeftAlone() {
  const version = buildVersion(1, {});
  expect(replaceVersionReferences(['see `nope`'], version)).toEqual(['see `nope`']);
}

function validateNoTableWithoutLongValues() {
  const version = buildVersion(1, { state: { n: 1 } });
  expect(replaceVersionReferences(['`n`'], version)).toEqual(["'1'"]);
}

function validateChangesBulletsAreNotTouched() {
  const state1 = { name: 'Ann' };
  const state2 = { name: 'Bob' };
  const versions = [buildVersion(1, { state: state1 }), buildVersion(2, { state: state2, note: 'now `name`' })];
  const markdown = buildReportMarkdown(versions);
  expect(markdown).toContain('- state: `name` changed');
  expect(markdown).toContain("now 'Bob'");
}

test('test_short_value_is_replaced', validateShortValueIsReplaced);
test('test_questions_are_used_after_state', validateQuestionsAreUsedAfterState);
test('test_long_value_is_kept_and_defined', validateLongValueIsKeptAndDefined);
test('test_multi_line_value_uses_spaces', validateMultiLineValueUsesSpaces);
test('test_pipe_is_escaped', validatePipeIsEscaped);
test('test_same_name_gives_one_row', validateSameNameGivesOneRow);
test('test_missing_name_is_left_alone', validateMissingNameIsLeftAlone);
test('test_no_table_without_long_values', validateNoTableWithoutLongValues);
test('test_changes_bullets_are_not_touched', validateChangesBulletsAreNotTouched);
