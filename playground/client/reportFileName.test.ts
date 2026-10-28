import { test, expect } from 'bun:test';
import { computeReportFileName } from './reportFileName';

function validateOpenFileNameLosesItsExtension() {
  expect(computeReportFileName('prompt-intent hook queries.json')).toBe('prompt-intent hook queries-notes.md');
}

function validateOnlyTheLastExtensionIsRemoved() {
  expect(computeReportFileName('a.b.json')).toBe('a.b-notes.md');
}

function validateNameWithoutExtensionIsKept() {
  expect(computeReportFileName('versions')).toBe('versions-notes.md');
}

function validateNewPageUsesNotesMd() {
  expect(computeReportFileName(null)).toBe('notes.md');
}

test('test_open_file_name_loses_its_extension', validateOpenFileNameLosesItsExtension);
test('test_only_the_last_extension_is_removed', validateOnlyTheLastExtensionIsRemoved);
test('test_name_without_extension_is_kept', validateNameWithoutExtensionIsKept);
test('test_new_page_uses_notes_md', validateNewPageUsesNotesMd);
