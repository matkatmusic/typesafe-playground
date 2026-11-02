import { test, expect, afterEach } from 'bun:test'
import { computeInputTokens, computeTotalInputTokens, formatCostText, formatTokensText, formatTotalCostText, INPUT_COST_PER_MILLION, renderCostAndTokens, renderTotalCost } from './costTokens'
import { pageState } from './state'
import type { RunOutput, Version } from '../playgroundHistory'

class FakeBox { textContent = '' }

function makeVersion(inputTokenCounts: number[]) {
    const outputs: RunOutput[] = []
    for (const inputTokens of inputTokenCounts)
        outputs.push({ answers: {}, usage: { input_tokens: inputTokens, output_tokens: 1 } } as unknown as RunOutput)
    return { id: 1, time: 't', state: {}, questions: {}, calls: outputs.length, outputs } as Version
}

function removeFakeDom() {
    Reflect.deleteProperty(globalThis, 'document')
}

afterEach(removeFakeDom)

function validateTokensAddUpAcrossOutputs() {
    expect(computeInputTokens(makeVersion([100, 20]))).toBe(120)
    expect(computeInputTokens(makeVersion([]))).toBe(0)
}

function validateCostIsTokensTimesPricePerMillion() {
    expect(INPUT_COST_PER_MILLION).toBe(0.042)
    expect(formatCostText(1000000)).toBe('Cost: $0.042000')
    expect(formatCostText(0)).toBe('Cost: $0.000000')
    expect(formatTokensText(1000000)).toBe('Tokens: 1000000')
}

function validateTotalCostAddsEveryVersionWithSixDecimals() {
    // Step: two versions hold 500000 and 1500000 input tokens.
    const versions = [makeVersion([500000]), makeVersion([1000000, 500000]), makeVersion([])]
    // Step: the total tokens are 2000000, so the total cost is 2000000 * 0.042 / 1000000.
    expect(computeTotalInputTokens(versions)).toBe(2000000)
    expect(formatTotalCostText(2000000)).toBe('total cost: $0.084000')
    expect(formatTotalCostText(0)).toBe('total cost: $0.000000')
}

function validateRenderTotalCostReadsEveryVersionInThePageState() {
    const elements: Record<string, FakeBox> = { totalCostLabel: new FakeBox() }
    Object.assign(globalThis, { document: { getElementById: (id: string) => elements[id] } })
    pageState.versions = [makeVersion([1000000]), makeVersion([1000000])]
    renderTotalCost()
    pageState.versions = []
    expect(elements.totalCostLabel.textContent).toBe('total cost: $0.084000')
}

function validateRenderFillsBothLabels() {
    const elements: Record<string, FakeBox> = { costLabel: new FakeBox(), tokensLabel: new FakeBox(), totalCostLabel: new FakeBox() }
    function getElementById(id: string) {
        return elements[id]
    }
    Object.assign(globalThis, { document: { getElementById } })
    renderCostAndTokens(makeVersion([500000, 500000]))
    expect(elements.costLabel.textContent).toBe('Cost: $0.042000')
    expect(elements.tokensLabel.textContent).toBe('Tokens: 1000000')
}

test('test_tokens_add_up_across_outputs', validateTokensAddUpAcrossOutputs)
test('test_cost_is_tokens_times_price_per_million', validateCostIsTokensTimesPricePerMillion)
test('test_total_cost_adds_every_version_with_six_decimals', validateTotalCostAddsEveryVersionWithSixDecimals)
test('test_render_total_cost_reads_every_version_in_the_page_state', validateRenderTotalCostReadsEveryVersionInThePageState)
test('test_render_fills_both_labels', validateRenderFillsBothLabels)
