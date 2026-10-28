import { test, expect } from 'bun:test'
import { parsePageData, readPageData } from './pageData'

function validateParsePageDataReadsVersionsAndHasEnvKey() {
    // expect(parsePageData('{"versions":[],"draft":null,"hasEnvKey":true}')).toEqual({ versions: [], draft: null, hasEnvKey: true })
    // expect(parsePageData('{"versions":[],"draft":{"state":"s","questions":"q"},"hasEnvKey":false}')).toEqual({ versions: [], draft: { state: 's', questions: 'q' }, hasEnvKey: false })
    expect(parsePageData('{"versions":[],"hasEnvKey":true}')).toEqual({ versions: [], hasEnvKey: true })
    expect(parsePageData('{"versions":[],"hasEnvKey":false}')).toEqual({ versions: [], hasEnvKey: false })
}

function validateReadPageDataThrowsWithoutADocument() {
    expect(() => readPageData()).toThrow()
}

test('test_parse_page_data_reads_versions_and_has_env_key', validateParsePageDataReadsVersionsAndHasEnvKey)
test('test_read_page_data_throws_without_a_document', validateReadPageDataThrowsWithoutADocument)
