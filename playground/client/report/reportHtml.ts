import { Marked, type Tokens } from 'marked';

function replaceHtmlCharacters(text: string): string {
  const withAmpersands = text.replaceAll('&', '&amp;');
  const withLessThans = withAmpersands.replaceAll('<', '&lt;');
  const withGreaterThans = withLessThans.replaceAll('>', '&gt;');
  const withDoubleQuotes = withGreaterThans.replaceAll('"', '&quot;');
  return withDoubleQuotes.replaceAll("'", '&#39;');
}

function renderEscapedHtml(token: Tokens.HTML | Tokens.Tag): string {
  return replaceHtmlCharacters(token.text);
}

const reportMarked = new Marked({ renderer: { html: renderEscapedHtml } });

export function renderReportHtml(markdown: string): string {
  return reportMarked.parse(markdown, { async: false });
}
