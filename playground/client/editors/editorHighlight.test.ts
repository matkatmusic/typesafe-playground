import { test, expect } from 'bun:test';
import { getJsonHighlight } from './editorHighlight';

function getCssPath(): string {
    return `${import.meta.dir}/../../page/playgroundBase.css`;
}

function getTokenVariables(): string[] {
    return ['--tok-string', '--tok-number', '--tok-key', '--tok-atom', '--tok-punct'];
}

function extractBlock(css: string, startMarker: string): string {
    const start = css.indexOf(startMarker);
    if (start === -1)
        throw new Error(`css has no block ${startMarker}`);
    const end = css.indexOf('}', start);
    return css.slice(start, end);
}

function validateEveryRuleUsesAKnownCssVariable() {
    expect(getJsonHighlight().specs.length).toBe(5);
    for (const spec of getJsonHighlight().specs) {
        const match = /^var\((--[a-z-]+)\)$/.exec(String(spec.color));
        if (match === null)
            throw new Error(`color ${spec.color} is not a css variable`);
        expect(getTokenVariables()).toContain(match[1]);
    }
}

async function validateBothThemesDefineEveryTokenVariableWithDifferentValues() {
    const css = await Bun.file(getCssPath()).text();
    const lightBlock = extractBlock(css, ':root {');
    const darkBlock = extractBlock(css, ':root[data-theme="dark"] {');
    for (const variable of getTokenVariables()) {
        const pattern = new RegExp(`${variable}:\\s*([^;]+);`);
        const lightValue = pattern.exec(lightBlock)?.[1];
        const darkValue = pattern.exec(darkBlock)?.[1];
        expect(lightValue).toBeDefined();
        expect(darkValue).toBeDefined();
        expect(lightValue).not.toBe(darkValue);
    }
}

test('test_every_rule_uses_a_known_css_variable', validateEveryRuleUsesAKnownCssVariable);
test('test_both_themes_define_every_token_variable_with_different_values', validateBothThemesDefineEveryTokenVariableWithDifferentValues);
