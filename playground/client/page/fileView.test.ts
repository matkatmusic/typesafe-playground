import { test, expect } from 'bun:test'
import { formatTabTitle, refreshFileView } from './fileView'

function validateTabTitleShowsFileNameOrUntitled() {
    expect(formatTabTitle(null)).toBe('Playground - Untitled')
    expect(formatTabTitle('playground-versions.json')).toBe('Playground - playground-versions.json')
}

function validateRefreshWithoutDocumentThrows() {
    expect(() => refreshFileView()).toThrow()
}

test('test_tab_title_shows_file_name_or_untitled', validateTabTitleShowsFileNameOrUntitled)
test('test_refresh_without_a_document_throws', validateRefreshWithoutDocumentThrows)
