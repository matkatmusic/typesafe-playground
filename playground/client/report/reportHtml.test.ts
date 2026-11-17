import { test, expect } from 'bun:test';
import { renderReportHtml } from './reportHtml';

function validateHeadingsBecomeHtml() {
  expect(renderReportHtml('## Version 1')).toContain('<h2>Version 1</h2>');
}

function validateBlockHtmlIsEscaped() {
  const html = renderReportHtml('<script>alert(1)</script>');
  expect(html).not.toContain('<script>');
  expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
}

function validateInlineHtmlIsEscaped() {
  const html = renderReportHtml('a <img src=x onerror=alert(1)> b');
  expect(html).not.toContain('<img');
  expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
}

test('test_headings_become_html', validateHeadingsBecomeHtml);
test('test_block_html_is_escaped', validateBlockHtmlIsEscaped);
test('test_inline_html_is_escaped', validateInlineHtmlIsEscaped);
