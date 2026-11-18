import { test, expect } from 'bun:test';

function getExpectedBundleTexts(): string[] {
    const names = 'lightDarkModeButton columnResizer rowResizer resultJsonEditor jsonToggleButton graphContainerBox collapseAllButton expandAllButton replaceReferencesCheckbox stateJsonEditor questionsJsonEditor submitButton stateFormatJsonButton questionsFormatJsonButton noteText questionsAddQuestion resetButton prevVersionButton nextVersionButton lastEditedLabel /open stateNotesButton notesDialog questionsNotesButton resultNotesButton';
    return names.split(' ');
}

async function validateMainBundlesForTheBrowser() {
    const result = await Bun.build({
        entrypoints: [`${import.meta.dir}/main.ts`],
        target: 'browser',
        format: 'esm',
    });
    expect(result.success).toBe(true);
    const script = await result.outputs[0].text();
    for (const expectedText of getExpectedBundleTexts()) {
        expect(script.includes(expectedText)).toBe(true);
    }
}

test('test_main_bundles_for_the_browser', validateMainBundlesForTheBrowser);
