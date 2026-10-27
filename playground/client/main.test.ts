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
}

test('test_main_bundles_for_the_browser', validateMainBundlesForTheBrowser)
