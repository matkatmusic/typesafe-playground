import { test, expect } from 'bun:test';

function getCssPath(): string {
    return `${import.meta.dir}/../../page/playgroundBase.css`;
}

async function getActiveCssLines(): Promise<string[]> {
    const css = await Bun.file(getCssPath()).text();
    const activeLines: string[] = [];
    for (const line of css.split('\n')) {
        const isComment = line.trimStart().startsWith('/*');
        if (!isComment) {
            activeLines.push(line);
        }
    }
    return activeLines;
}

function getLinesStartingWith(lines: string[], prefix: string): string[] {
    const matchingLines: string[] = [];
    for (const line of lines) {
        const startsWithPrefix = line.startsWith(prefix);
        if (startsWithPrefix) {
            matchingLines.push(line);
        }
    }
    return matchingLines;
}

async function validateReportBodyRuleHasAutoFlexBasis() {
    const activeLines = await getActiveCssLines();
    const reportBodyRules = getLinesStartingWith(activeLines, '#reportBody {');
    expect(reportBodyRules.length).toBe(1);
    expect(reportBodyRules[0]).toContain('flex: 1 1 auto;');
}

test('test_report_body_rule_has_auto_flex_basis', validateReportBodyRuleHasAutoFlexBasis);

async function validateReportDialogHasFixedInsetSize() {
    const activeLines = await getActiveCssLines();
    const reportDialogRules = getLinesStartingWith(activeLines, '#reportDialog {');
    expect(reportDialogRules.length).toBe(1);
    expect(reportDialogRules[0]).toContain('inset: 40px;');
    expect(reportDialogRules[0]).toContain('max-block-size: none;');
    expect(reportDialogRules[0]).not.toContain('85vh');
}

test('test_report_dialog_has_fixed_inset_size', validateReportDialogHasFixedInsetSize);

async function validateReportBodyTableKeepsNameColumnOnOneLine() {
    const activeLines = await getActiveCssLines();
    const firstColumnRules = getLinesStartingWith(activeLines, '#reportBody td:first-child {');
    expect(firstColumnRules.length).toBe(1);
    expect(firstColumnRules[0]).toContain('white-space: nowrap;');
    const cellRules = getLinesStartingWith(activeLines, '#reportBody th, #reportBody td {');
    expect(cellRules.length).toBe(1);
    expect(cellRules[0]).toContain('border: 1px solid var(--grid);');
}

test('test_report_body_table_keeps_name_column_on_one_line', validateReportBodyTableKeepsNameColumnOnOneLine);
