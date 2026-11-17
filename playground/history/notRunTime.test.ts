import { expect, test } from 'bun:test';
import { NOT_RUN_TIME } from './notRunTime';

test('test_not_run_time_is_the_not_run_yet_label', () => {
    // Scenario: the placeholder shown for a question that has no run time.
    // Step: read the constant.
    // Step: assert it equals the label 'not run yet'.
    expect(NOT_RUN_TIME).toBe('not run yet');
});
