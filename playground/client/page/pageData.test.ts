import { test, expect } from 'bun:test';
import { parsePageData, readPageData } from './pageData';

function validateParsePageDataReadsVersionsAndHasEnvKey() {
  // expect(parsePageData('{"versions":[],"draft":null,"hasEnvKey":true}')).toEqual({ versions: [], draft: null, hasEnvKey: true })
  // expect(parsePageData('{"versions":[],"draft":{"state":"s","questions":"q"},"hasEnvKey":false}')).toEqual({ versions: [], draft: { state: 's', questions: 'q' }, hasEnvKey: false })
  // expect(parsePageData('{"versions":[],"historyPath":"h.json","hasEnvKey":true}')).toEqual({ versions: [], historyPath: 'h.json', hasEnvKey: true })
  // expect(parsePageData('{"versions":[],"historyPath":"h.json","hasEnvKey":false}')).toEqual({ versions: [], historyPath: 'h.json', hasEnvKey: false })
  expect(parsePageData('{"versions":[],"historyPath":"h.json","hasSubqEnvKey":false,"hasEnvKey":true}')).toEqual({ versions: [], historyPath: 'h.json', hasSubqEnvKey: false, hasEnvKey: true });
  expect(parsePageData('{"versions":[],"historyPath":"h.json","hasSubqEnvKey":false,"hasEnvKey":false}')).toEqual({ versions: [], historyPath: 'h.json', hasSubqEnvKey: false, hasEnvKey: false });
}

function validateParsePageDataKeepsHasSubqEnvKeyTrue() {
  expect(parsePageData('{"versions":[],"historyPath":"h.json","hasSubqEnvKey":true,"hasEnvKey":false}')).toEqual({ versions: [], historyPath: 'h.json', hasSubqEnvKey: true, hasEnvKey: false });
}

function validateReadPageDataThrowsWithoutADocument() {
  expect(() => readPageData()).toThrow();
}

test('test_parse_page_data_reads_versions_and_has_env_key', validateParsePageDataReadsVersionsAndHasEnvKey);
test('test_parse_page_data_keeps_has_subq_env_key_true', validateParsePageDataKeepsHasSubqEnvKeyTrue);
test('test_read_page_data_throws_without_a_document', validateReadPageDataThrowsWithoutADocument);
