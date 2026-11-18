import { readFileSync } from 'node:fs';
import { test, expect } from 'bun:test';

import { renderPage } from '../../page/renderPage';

function getPageHtml(): string {
    return renderPage({ css: '', script: '', dataJson: '{}' }).toString();
}

function getPageCss(): string {
    return readFileSync(`${import.meta.dir}/../../page/playgroundBase.css`, 'utf8');
}

function listLinesStartingWith(lines: string[], prefix: string): string[] {
    const matchingLines: string[] = [];
    for (const line of lines) {
        const startsWithPrefix = line.startsWith(prefix);
        if (startsWithPrefix)
            matchingLines.push(line);
    }
    return matchingLines;
}

function listActiveCssLines(): string[] {
    const lines: string[] = [];
    for (const line of getPageCss().split('\n')) {
        const isComment = line.trimStart().startsWith('/*');
        if (!isComment)
            lines.push(line);
    }
    return lines;
}

function validateProviderControlIsACheckboxSwitchThatStartsDisabled() {
    const activeHtml = getPageHtml().replace(/<!--[\s\S]*?-->/g, '');
    expect(activeHtml).toContain('<input id="providerSwitch" type="checkbox" role="switch" disabled');
    expect(activeHtml).not.toContain('id="providerSlider"');
}

function validateSwitchIsAPillOfFortyByTwentyPixelsWithoutTheNativeLook() {
    const switchLines = listLinesStartingWith(listActiveCssLines(), '#providerSwitch {');
    expect(switchLines.length).toBe(1);
    expect(switchLines[0]).toContain('appearance: none');
    expect(switchLines[0]).toContain('inline-size: 40px');
    expect(switchLines[0]).toContain('block-size: 20px');
    expect(switchLines[0]).toContain('border-radius: 10px');
}

function validateKnobIsASixteenPixelWhiteCircleThatMovesRightWhenChecked() {
    const activeCss = listActiveCssLines().join('\n');
    expect(activeCss).toContain('#providerSwitch::before');
    expect(activeCss).toContain('inline-size: 16px');
    expect(activeCss).toContain('background: white');
    expect(activeCss).toContain('transition');
    expect(activeCss).toContain('#providerSwitch:checked');
    expect(activeCss).toContain('#providerSwitch:checked::before');
}

function validateDisabledSwitchIsFadedWithANotAllowedCursor() {
    const disabledLines = listLinesStartingWith(listActiveCssLines(), '#providerSwitch:disabled');
    expect(disabledLines.length).toBe(1);
    expect(disabledLines[0]).toContain('opacity');
    expect(disabledLines[0]).toContain('cursor: not-allowed');
}

function validateProviderLabelsHaveIdsAndTheProviderBarColors() {
    const activeHtml = getPageHtml().replace(/<!--[\s\S]*?-->/g, '');
    expect(activeHtml).toContain('<span id="providerTypeSafeLabel">TypeSafe</span>');
    expect(activeHtml).toContain('<span id="providerSubqLabel">SubQ</span>');
    const activeLines = listActiveCssLines();
    expect(listLinesStartingWith(activeLines, '#providerTypeSafeLabel { color: #009E73;')).toHaveLength(1);
    expect(listLinesStartingWith(activeLines, '#providerSubqLabel { color: #56B4E9;')).toHaveLength(1);
}

test('test_provider_labels_have_ids_and_the_provider_bar_colors', validateProviderLabelsHaveIdsAndTheProviderBarColors);
test('test_provider_control_is_a_checkbox_switch_that_starts_disabled',validateProviderControlIsACheckboxSwitchThatStartsDisabled);
test('test_switch_is_a_pill_of_forty_by_twenty_pixels_without_the_native_look', validateSwitchIsAPillOfFortyByTwentyPixelsWithoutTheNativeLook);
test('test_knob_is_a_sixteen_pixel_white_circle_that_moves_right_when_checked', validateKnobIsASixteenPixelWhiteCircleThatMovesRightWhenChecked);
test('test_disabled_switch_is_faded_with_a_not_allowed_cursor', validateDisabledSwitchIsFadedWithANotAllowedCursor);
