import { test, expect, afterEach, describe } from 'bun:test';
import { appendEditedVersion } from './appendEditedVersion';
import { pageState } from '../page/state';
import { getHardCodedQuestions, getHardCodedState } from '../../providers/typeSafeQuery';
import { buildVersion, installOpenFetch, installPage, resetFakePage } from './appendEditedVersionFakePage';

async function validateEditedStateOfAnUnrunDefaultVersionOverwritesItInPlace() {
    // Scenario: the only version holds the default state, was never run, and the user edits the state and saves.
    const { refreshSpy } = installPage('{"a": 2}', '{"q": 1}');
    const seen = installOpenFetch();
    pageState.versions = [{ ...buildVersion(), state: getHardCodedState() }];
    pageState.index = 0;
    expect(await appendEditedVersion()).toBe(true);
    expect(seen.length).toBe(1);
    expect(seen[0].path).toBe('/open');
    expect(seen[0].body.versions).toEqual([{ ...buildVersion(), state: { a: 2 } }]);
    expect(pageState.versions.length).toBe(1);
    expect(pageState.index).toBe(0);
    expect(pageState.versions[0].note).toBe('old note');
    expect(refreshSpy).toHaveBeenCalledTimes(1);
}

async function validateEditedQuestionsOfAnUnrunDefaultVersionOverwritesItInPlace() {
    installPage('{"a": 1}', '{"q": 2}');
    const seen = installOpenFetch();
    pageState.versions = [{ ...buildVersion(), questions: getHardCodedQuestions() }];
    expect(await appendEditedVersion()).toBe(true);
    expect(seen[0].body.versions).toEqual([{ ...buildVersion(), questions: { q: 2 } }]);
    expect(pageState.versions.length).toBe(1);
}

async function validateOverwriteKeepsThePinOnTheSamePlace() {
    installPage('{"a": 2}', '{"q": 1}');
    installOpenFetch();
    pageState.versions = [{ ...buildVersion(), state: getHardCodedState() }];
    pageState.pinnedIndex = 0;
    await appendEditedVersion();
    expect(pageState.pinnedIndex).toBe(0);
    pageState.pinnedIndex = null;
}

function registerOverwriteTests() {
    afterEach(resetFakePage);
    test('test_edited_state_of_an_unrun_default_version_overwrites_it_in_place', validateEditedStateOfAnUnrunDefaultVersionOverwritesItInPlace);
    test('test_edited_questions_of_an_unrun_default_version_overwrites_it_in_place', validateEditedQuestionsOfAnUnrunDefaultVersionOverwritesItInPlace);
    test('test_overwrite_keeps_the_pin_on_the_same_place', validateOverwriteKeepsThePinOnTheSamePlace);
}

describe('appendEditedVersion overwrite', registerOverwriteTests);
