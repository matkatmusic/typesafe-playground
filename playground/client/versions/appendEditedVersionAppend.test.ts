import { test, expect, afterEach, spyOn, describe } from 'bun:test';
import { appendEditedVersion } from './appendEditedVersion';
import * as saveVersionNote from '../notes/saveVersionNote';
import { pageState } from '../page/state';
import { getHardCodedQuestions, getHardCodedState } from '../../providers/typeSafeQuery';
import { buildVersion, installOpenFetch, installPage, resetFakePage } from './appendEditedVersionFakePage';

async function executePinnedAppend() {
    const spies = installPage('{"a": 2}', '{"q": 1}');
    const seen = installOpenFetch();
    pageState.pinnedIndex = 0;
    const appended = await appendEditedVersion();
    return { ...spies, seen, appended };
}

async function validateEditedTextAppendsOneUnrunVersionWithTheParsedText() {
    const { seen, appended } = await executePinnedAppend();
    expect(appended).toBe(true);
    expect(seen.length).toBe(1);
    expect(seen[0].path).toBe('/open');
    expect(seen[0].body.versions).toEqual([
        buildVersion(),
        { time: 'not run yet', state: { a: 2 }, questions: { q: 1 }, calls: 0, outputs: [] },
    ]);
}

async function validateAppendMovesTheIndexAndKeepsThePin() {
    const { refreshSpy, arrowsSpy, pinSpy } = await executePinnedAppend();
    expect(pageState.versions.length).toBe(2);
    expect(pageState.index).toBe(1);
    expect(pageState.pinnedIndex).toBe(0);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(arrowsSpy).toHaveBeenCalledTimes(1);
    expect(pinSpy).toHaveBeenCalledTimes(1);
}

async function validateAppendRendersTheAppendedVersion() {
    const { renderSpies } = await executePinnedAppend();
    const appendedVersion = pageState.versions[1];
    expect(renderSpies.note).toHaveBeenCalledWith(appendedVersion);
    expect(renderSpies.cost).toHaveBeenCalledWith(appendedVersion);
    expect(renderSpies.result).toHaveBeenCalledWith([]);
    expect(renderSpies.graphs.mock.calls[0][0]).toBe(appendedVersion);
    expect(renderSpies.winners.mock.calls[0][0]).toBe(appendedVersion);
}

async function validateAppendDoesNotRefillTheEditors() {
    const { renderSpies } = await executePinnedAppend();
    expect(renderSpies.stateFill).not.toHaveBeenCalled();
    expect(renderSpies.questionsFill).not.toHaveBeenCalled();
}

async function validateAppendedVersionGetsTheInheritedStateNote() {
    installPage('{"a": 2}', '{"q": 1}');
    installOpenFetch();
    const saveSpy = spyOn(saveVersionNote, 'saveInheritedNote').mockResolvedValue(undefined);
    pageState.versions = [{ ...buildVersion(), stateNote: 'base note', questionsNote: 'base questions' }];
    await appendEditedVersion();
    expect(saveSpy).toHaveBeenCalledWith('state', 'base note', false, pageState.versions[1]);
    expect(saveSpy).toHaveBeenCalledWith('questions', 'base questions', true, pageState.versions[1]);
}

async function validateEditedTextOfAVersionWithResultsAppendsANewVersion() {
    installPage('{"a": 2}', '{"q": 1}');
    const seen = installOpenFetch();
    pageState.versions = [{ ...buildVersion(), state: getHardCodedState(), questions: getHardCodedQuestions(), outputs: [{}] as never }];
    await appendEditedVersion();
    expect(seen[0].body.versions.length).toBe(2);
    expect(pageState.versions.length).toBe(2);
    expect(pageState.index).toBe(1);
}

function resetPinnedIndex() {
    pageState.pinnedIndex = null;
}

function registerAppendTests() {
    afterEach(resetFakePage);
    afterEach(resetPinnedIndex);
    test('test_appended_version_gets_the_inherited_state_note', validateAppendedVersionGetsTheInheritedStateNote);
    test('test_edited_text_appends_one_unrun_version_with_the_parsed_text', validateEditedTextAppendsOneUnrunVersionWithTheParsedText);
    test('test_append_moves_the_index_and_keeps_the_pin', validateAppendMovesTheIndexAndKeepsThePin);
    test('test_append_renders_the_appended_version', validateAppendRendersTheAppendedVersion);
    test('test_append_does_not_refill_the_editors', validateAppendDoesNotRefillTheEditors);
    test('test_edited_text_of_a_version_with_results_appends_a_new_version', validateEditedTextOfAVersionWithResultsAppendsANewVersion);
}

describe('appendEditedVersion append', registerAppendTests);
