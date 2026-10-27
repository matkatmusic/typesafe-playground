import { test, expect } from 'bun:test'
import { parsePageData, readPageData } from './pageData'

function validateParsePageDataReadsHasEnvKey() {
    expect(parsePageData('{"hasEnvKey":true}')).toEqual({ hasEnvKey: true })
    expect(parsePageData('{"hasEnvKey":false}')).toEqual({ hasEnvKey: false })
}

function validateReadPageDataThrowsWithoutADocument() {
    expect(() => readPageData()).toThrow()
}

test('test_parse_page_data_reads_has_env_key', validateParsePageDataReadsHasEnvKey)
test('test_read_page_data_throws_without_a_document', validateReadPageDataThrowsWithoutADocument)
