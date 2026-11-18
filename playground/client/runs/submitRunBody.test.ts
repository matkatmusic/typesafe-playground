import { test, expect, afterEach, describe } from 'bun:test';
import { pageState } from '../page/state';
import { buildRunBody, formatRunFailure } from './submit';
import { getVersion, installFakeDom, removeFakeDom } from './submitFakeDom';

function validateRunBodyHoldsCallsTheTrimmedTypedKeyTheStateAndTheQuestions() {
    const elements = installFakeDom(true);
    elements.callsPicker.value = '3';
    elements.typeSafeKeyEditor.value = ' typed ';
    pageState.versions = [getVersion(), { ...getVersion() }];
    pageState.index = 1;
    expect(buildRunBody({ a: 1 }, { q: 1 })).toEqual({ index: 1, calls: 3, apiKey: 'typed', provider: 'TypeSafe', state: { a: 1 }, questions: { q: 1 } });
}

function validateRunBodyHoldsTheSubqProviderWhenTheSwitchIsOn() {
    const elements = installFakeDom(true);
    elements.providerSwitch.checked = true;
    pageState.versions = [getVersion()];
    pageState.index = 0;
    expect(buildRunBody({ a: 1 }, { q: 1 }).provider).toBe('SubQ');
}

function validateRunFailureNamesTheStatusAndText() {
    expect(formatRunFailure(500, 'boom')).toBe('Run failed: 500 boom');
}

function registerRunBodyTests() {
    afterEach(removeFakeDom);
    test('test_run_body_holds_calls_the_trimmed_typed_key_the_state_and_the_questions', validateRunBodyHoldsCallsTheTrimmedTypedKeyTheStateAndTheQuestions);
    test('test_run_body_holds_the_subq_provider_when_the_switch_is_on', validateRunBodyHoldsTheSubqProviderWhenTheSwitchIsOn);
    test('test_run_failure_names_the_status_and_text', validateRunFailureNamesTheStatusAndText);
}

describe('submitRunBody', registerRunBodyTests);
