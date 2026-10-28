import { test, expect } from 'bun:test'

const CSS_PATH = `${import.meta.dir}/../page/playground.css`

async function validateReportBodyRuleHasAutoFlexBasis() {
    const css = await Bun.file(CSS_PATH).text()
    const activeLines = css.split('\n').filter(line => !line.trimStart().startsWith('/*'))
    const reportBodyRules = activeLines.filter(line => line.startsWith('#reportBody {'))
    expect(reportBodyRules.length).toBe(1)
    expect(reportBodyRules[0]).toContain('flex: 1 1 auto;')
}

test('test_report_body_rule_has_auto_flex_basis', validateReportBodyRuleHasAutoFlexBasis)

async function validateReportDialogHasFixedInsetSize() {
    const css = await Bun.file(CSS_PATH).text()
    const activeLines = css.split('\n').filter(line => !line.trimStart().startsWith('/*'))
    const reportDialogRules = activeLines.filter(line => line.startsWith('#reportDialog {'))
    expect(reportDialogRules.length).toBe(1)
    expect(reportDialogRules[0]).toContain('inset: 40px;')
    expect(reportDialogRules[0]).toContain('max-height: none;')
    expect(reportDialogRules[0]).not.toContain('85vh')
}

test('test_report_dialog_has_fixed_inset_size', validateReportDialogHasFixedInsetSize)

async function validateReportBodyTableKeepsNameColumnOnOneLine() {
    const css = await Bun.file(CSS_PATH).text()
    const activeLines = css.split('\n').filter(line => !line.trimStart().startsWith('/*'))
    const firstColumnRules = activeLines.filter(line => line.startsWith('#reportBody td:first-child {'))
    expect(firstColumnRules.length).toBe(1)
    expect(firstColumnRules[0]).toContain('white-space: nowrap;')
    const cellRules = activeLines.filter(line => line.startsWith('#reportBody th, #reportBody td {'))
    expect(cellRules.length).toBe(1)
    expect(cellRules[0]).toContain('border: 1px solid var(--grid);')
}

test('test_report_body_table_keeps_name_column_on_one_line', validateReportBodyTableKeepsNameColumnOnOneLine)
