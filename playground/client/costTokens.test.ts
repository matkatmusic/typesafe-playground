import { test, expect, afterEach } from 'bun:test'
import { computeInputTokens, formatCostText, formatTokensText, INPUT_COST_PER_MILLION, renderCostAndTokens } from './costTokens'
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

function validateRenderFillsBothLabels() {
    const elements: Record<string, FakeBox> = { costLabel: new FakeBox(), tokensLabel: new FakeBox() }
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
test('test_render_fills_both_labels', validateRenderFillsBothLabels)
