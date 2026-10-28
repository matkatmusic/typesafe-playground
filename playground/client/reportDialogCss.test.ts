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
