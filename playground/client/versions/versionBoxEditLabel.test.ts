import { describe, test, expect, afterEach, spyOn } from 'bun:test';
import * as editors from '../editors/editors';
import { pageState } from '../page/state';
import { getHardCodedQuestions } from '../../providers/typeSafeQuery';
import { updateOnEditorChange } from './versionBox';
import { buildStubStateEditor, installFakeDom, installQuestionsStub, createDefaultVersion, createVersion, removeFakeState } from './versionBoxFakeDom';

function validateEditMarksDirtyButFillDoesNot() {
    const elements = installFakeDom();
    pageState.versions = [createVersion(1, { a: 1 })];
    installQuestionsStub('{}');
    spyOn(editors, 'getStateEditor').mockReturnValue(buildStubStateEditor('{"a":2}'));
    const fillUpdate = { docChanged: true, transactions: [{ annotation: () => true }] };
    updateOnEditorChange(fillUpdate as never);
    expect(pageState.isDirty).toBe(false);
    expect(elements.lastEditedLabel.textContent).toBe('');
    const typedUpdate = { docChanged: true, transactions: [{ annotation: () => undefined }] };
    updateOnEditorChange(typedUpdate as never);
    expect(pageState.isDirty).toBe(true);
    expect(elements.lastEditedLabel.textContent.startsWith('last edited: ')).toBe(true);
    expect(elements.versionLabel.textContent).toBe('version 2 of 2 · not run yet · 0 calls');
}

function validateQuestionsOnlyChangeShowsTheNextVersionAsNotRunYet() {
    const elements = installFakeDom();
    pageState.versions = [createVersion(1, { a: 1 })];
    spyOn(editors, 'getStateEditor').mockReturnValue(buildStubStateEditor('{"a":1}'));
    installQuestionsStub('{"q":1}');
    updateOnEditorChange({ docChanged: true, transactions: [] } as never);
    expect(elements.versionLabel.textContent).toBe('version 2 of 2 · not run yet · 0 calls');
}

function validateEditOfAnUnrunDefaultVersionKeepsTheLabelAtOneOfOne() {
    const elements = installFakeDom();
    pageState.versions = [createDefaultVersion()];
    spyOn(editors, 'getStateEditor').mockReturnValue(buildStubStateEditor('{"a":1}'));
    installQuestionsStub(JSON.stringify(getHardCodedQuestions()));
    updateOnEditorChange({ docChanged: true, transactions: [] } as never);
    expect(elements.versionLabel.textContent).toBe('version 1 of 1 · not run yet · 0 calls');
}

function validateInvalidJsonKeepsTheEditedLabel() {
    const elements = installFakeDom();
    pageState.versions = [createDefaultVersion()];
    spyOn(editors, 'getStateEditor').mockReturnValue(buildStubStateEditor('{"a":'));
    installQuestionsStub(JSON.stringify(getHardCodedQuestions()));
    updateOnEditorChange({ docChanged: true, transactions: [] } as never);
    expect(elements.versionLabel.textContent).toBe('version 2 of 2 · not run yet · 0 calls');
}

function registerEditLabelTests() {
    afterEach(removeFakeState);
    test('test_edit_of_an_unrun_default_version_keeps_the_label_at_one_of_one', validateEditOfAnUnrunDefaultVersionKeepsTheLabelAtOneOfOne);
    test('test_invalid_json_keeps_the_edited_label', validateInvalidJsonKeepsTheEditedLabel);
    test('test_edit_marks_dirty_but_fill_does_not', validateEditMarksDirtyButFillDoesNot);
    test('test_questions_only_change_shows_the_next_version_as_not_run_yet', validateQuestionsOnlyChangeShowsTheNextVersionAsNotRunYet);
}

describe('versionBox edit label', registerEditLabelTests);
