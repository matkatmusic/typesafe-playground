import { describe, test, expect, afterEach } from 'bun:test';
import { getBarWidth, getPinnedPadding, getTopMargin } from './graphGeometry';
import { renderOption, renderProviderLetters } from './graphOption';

function createFakeNode(namespace: string, name: string) {
    const attrs: Record<string, string> = {};
    return { name, attrs, setAttribute(key: string, value: string) {
        attrs[key] = value;
    } };
}

function createFakeGroupNode(namespace: string, name: string) {
    const attrs: Record<string, string> = {};
    const children: unknown[] = [];
    return { name, attrs, children, textContent: '', setAttribute(key: string, value: string) {
        attrs[key] = value;
    }, appendChild(child: unknown) {
        children.push(child);
    } };
}

function removeFakeDocument() {
    Reflect.deleteProperty(globalThis, 'document');
}

function renderFakeOption(isAverageShown: boolean, isPinned = false) {
    Object.assign(globalThis, { document: { createElementNS: createFakeNode } });
    const nodes: ReturnType<typeof createFakeNode>[] = [];
    const svg = { appendChild(child: ReturnType<typeof createFakeNode>) {
        nodes.push(child);
    } };
    renderOption(svg as unknown as Element, [0.2, 0.6], 100, 100, isAverageShown, 0, isPinned, ['SubQ', 'TypeSafe']);
    return nodes;
}

function validateOneBarPerCallWithoutAverage() {
    const nodes = renderFakeOption(false);
    expect(nodes.length).toBe(2);
    expect(nodes[0].attrs.fill).toBe('#56B4E9');
}

function validateCallBarFillShowsTheProvider() {
    const nodes = renderFakeOption(false);
    expect(nodes[0].attrs.fill).toBe('#56B4E9');
    expect(nodes[1].attrs.fill).toBe('#009E73');
    expect(nodes[0].attrs.opacity).toBe('1');
}

function validatePinnedCallBarsKeepTheProviderFillAndAreFaded() {
    const nodes = renderFakeOption(false, true);
    expect(nodes[0].attrs.fill).toBe('#56B4E9');
    expect(nodes[1].attrs.fill).toBe('#009E73');
    expect(nodes[0].attrs.opacity).toBe('0.35');
}

function validateAverageBarKeepsItsOwnColorWhetherCurrentOrPinned() {
    expect(renderFakeOption(true)[0].attrs.fill).toBe('var(--confidence)');
    expect(renderFakeOption(true, true)[0].attrs.fill).toBe('var(--text-muted)');
}

function validateAverageAddsBarAndRangeLine() {
    const nodes = renderFakeOption(true);
    expect(nodes.length).toBe(4);
    expect(nodes[0].attrs.fill).toBe('var(--confidence)');
    expect(nodes[1].name).toBe('line');
}

function validatePinnedBarsAreMutedAndWiderThanCurrentBars() {
    const current = renderFakeOption(false)[0];
    const pinned = renderFakeOption(false, true)[0];
    expect(pinned.attrs.fill).toBe('#56B4E9');
    expect(pinned.attrs.opacity).toBe('0.35');
    expect(current.attrs.opacity).toBe('1');
    expect(Number(pinned.attrs.x)).toBe(Number(current.attrs.x) - getPinnedPadding());
    expect(Number(pinned.attrs.width)).toBe(Number(current.attrs.width) + 2 * getPinnedPadding());
    expect(pinned.attrs.y).toBe(current.attrs.y);
    expect(pinned.attrs.height).toBe(current.attrs.height);
}

function renderFakeProviderLetters(isAverageShown: boolean, isPinned = false) {
    Object.assign(globalThis, { document: { createElementNS: createFakeGroupNode } });
    const nodes: ReturnType<typeof createFakeGroupNode>[] = [];
    const svg = { appendChild(child: ReturnType<typeof createFakeGroupNode>) {
        nodes.push(child);
    } };
    renderProviderLetters(svg as unknown as Element, ['SubQ', 'TypeSafe'], 100, 100, isAverageShown, isPinned);
    return nodes;
}

function getLetterTexts(letters: { textContent: string }[]) {
    const texts: string[] = [];
    for (const letter of letters) {
        texts.push(letter.textContent);
    }
    return texts;
}

function validatePinnedProviderLettersSitInASecondMutedRowBelowTheCurrentLetters() {
    const current = (renderFakeProviderLetters(false)[0].children as { attrs: Record<string, string> }[])[0];
    const pinned = (renderFakeProviderLetters(false, true)[0].children as { attrs: Record<string, string> }[])[0];
    expect(pinned.attrs.x).toBe(current.attrs.x);
    expect(Number(pinned.attrs.y)).toBeGreaterThan(Number(current.attrs.y));
    expect(pinned.attrs.fill).toBe('var(--text-muted)');
    expect(current.attrs.fill).toBeUndefined();
}

function validateProviderLettersMarkSubqAsSAndTypeSafeAsTBelowTheBars() {
    const nodes = renderFakeProviderLetters(false);
    expect(nodes.length).toBe(1);
    const letters = nodes[0].children as { textContent: string; attrs: Record<string, string> }[];
    expect(getLetterTexts(letters)).toEqual(['s', 't']);
    expect(Number(letters[1].attrs.x) - Number(letters[0].attrs.x)).toBe(getBarWidth());
    expect(Number(letters[0].attrs.y)).toBeGreaterThan(getTopMargin() + 100);
}

function validateProviderLettersShiftRightByOneBarWhenTheAverageIsShown() {
    const plain = (renderFakeProviderLetters(false)[0].children as { attrs: Record<string, string> }[])[0];
    const shifted = (renderFakeProviderLetters(true)[0].children as { attrs: Record<string, string> }[])[0];
    expect(Number(shifted.attrs.x) - Number(plain.attrs.x)).toBe(getBarWidth());
}

function registerGraphOptionTests() {
    afterEach(removeFakeDocument);
    test('test_call_bar_fill_shows_the_provider', validateCallBarFillShowsTheProvider);
    test('test_pinned_call_bars_keep_the_provider_fill_and_are_faded', validatePinnedCallBarsKeepTheProviderFillAndAreFaded);
    test('test_average_bar_keeps_its_own_color_whether_current_or_pinned', validateAverageBarKeepsItsOwnColorWhetherCurrentOrPinned);
    test('test_pinned_provider_letters_sit_in_a_second_muted_row_below_the_current_letters', validatePinnedProviderLettersSitInASecondMutedRowBelowTheCurrentLetters);
    test('test_provider_letters_mark_subq_as_s_and_typesafe_as_t_below_the_bars', validateProviderLettersMarkSubqAsSAndTypeSafeAsTBelowTheBars);
    test('test_provider_letters_shift_right_by_one_bar_when_the_average_is_shown', validateProviderLettersShiftRightByOneBarWhenTheAverageIsShown);
    test('test_pinned_bars_are_muted_and_wider_than_current_bars', validatePinnedBarsAreMutedAndWiderThanCurrentBars);
    test('test_option_draws_one_bar_per_call_without_average', validateOneBarPerCallWithoutAverage);
    test('test_option_with_average_adds_bar_and_range_line', validateAverageAddsBarAndRangeLine);
}

describe('graphOption', registerGraphOptionTests);
