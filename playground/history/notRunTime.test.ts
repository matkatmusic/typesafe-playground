import { expect, test } from 'bun:test';
import { getNotRunTime } from './notRunTime';

function assertNotRunTimeIsTheNotRunYetLabel() {
    // Read the constant and assert it equals 'not run yet'.
    expect(getNotRunTime()).toBe('not run yet');
}

test('test_not_run_time_is_the_not_run_yet_label', assertNotRunTimeIsTheNotRunYetLabel);
