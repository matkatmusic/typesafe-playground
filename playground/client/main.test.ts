import { test, expect } from 'bun:test'

async function validateMainBundlesForTheBrowser() {
    const result = await Bun.build({
        entrypoints: [`${import.meta.dir}/main.ts`],
        target: 'browser',
        format: 'esm',
    })
    expect(result.success).toBe(true)
    const script = await result.outputs[0].text()
    expect(script.includes('lightDarkModeButton')).toBe(true)
    expect(script.includes('columnResizer')).toBe(true)
    expect(script.includes('rowResizer')).toBe(true)
    expect(script.includes('resultJsonEditor')).toBe(true)
    expect(script.includes('jsonToggleButton')).toBe(true)
    expect(script.includes('graphContainerBox')).toBe(true)
    expect(script.includes('collapseAllButton')).toBe(true)
    expect(script.includes('expandAllButton')).toBe(true)
    expect(script.includes('stateJsonEditor')).toBe(true)
    expect(script.includes('questionsJsonEditor')).toBe(true)
    expect(script.includes('submitButton')).toBe(true)
    expect(script.includes('noteText')).toBe(true)
    expect(script.includes('resetButton')).toBe(true)
    expect(script.includes('prevVersionButton')).toBe(true)
    expect(script.includes('nextVersionButton')).toBe(true)
    expect(script.includes('lastEditedLabel')).toBe(true)
    expect(script.includes('/open')).toBe(true)
}

test('test_main_bundles_for_the_browser', validateMainBundlesForTheBrowser)
