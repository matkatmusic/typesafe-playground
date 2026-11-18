import { test, expect } from 'bun:test';

async function readThemeBlock(selector: string): Promise<string> {
    const pageCss = await Bun.file(`${import.meta.dir}/../../page/playgroundBase.css`).text();
    const start = pageCss.indexOf(`${selector} {`);
    const end = pageCss.indexOf('}', start);
    return pageCss.slice(start, end);
}

function listActiveLines(block: string): string[] {
    const lines: string[] = [];
    for (const line of block.split('\n')) {
        const isComment = line.trimStart().startsWith('/*');
        if (!isComment)
            lines.push(line.trim());
    }
    return lines;
}

async function validateDarkModeIsBlackWithDarkGreyPanelsAndGrid() {
    const darkLines = listActiveLines(await readThemeBlock(':root[data-theme="dark"]'));
    expect(darkLines).toContain('--surface: #000000;');
    expect(darkLines).toContain('--panel: #141414;');
    expect(darkLines).toContain('--grid: #2e2e2e;');
}

async function validateLightModeColorsDoNotChange() {
    const lightLines = listActiveLines(await readThemeBlock(':root'));
    expect(lightLines).toContain('--surface: #fcfcfb;');
    expect(lightLines).toContain('--panel: #f3f2ef;');
    expect(lightLines).toContain('--grid: #dddcd7;');
}

async function validateHoveredBarBorderIsBlackInLightModeAndWhiteInDarkMode() {
    expect(listActiveLines(await readThemeBlock(':root'))).toContain('--hit-stroke: #000000;');
    expect(listActiveLines(await readThemeBlock(':root[data-theme="dark"]'))).toContain('--hit-stroke: #ffffff;');
}

test('test_hovered_bar_border_is_black_in_light_mode_and_white_in_dark_mode', validateHoveredBarBorderIsBlackInLightModeAndWhiteInDarkMode);
test('test_dark_mode_is_black_with_dark_grey_panels_and_grid',validateDarkModeIsBlackWithDarkGreyPanelsAndGrid);
test('test_light_mode_colors_do_not_change', validateLightModeColorsDoNotChange);
