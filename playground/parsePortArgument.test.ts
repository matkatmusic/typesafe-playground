import { test, expect } from 'bun:test'
import { parsePortArgument } from './parsePortArgument'

function validateMissingFlagPicksAutoPort() {
    expect(parsePortArgument([])).toBe(0)
    expect(parsePortArgument(['playground.ts'])).toBe(0)
}

function validateFlagGivesThePort() {
    expect(parsePortArgument(['--port', '5000'])).toBe(5000)
}

function validateBadPortThrows() {
    expect(() => parsePortArgument(['--port'])).toThrow()
    expect(() => parsePortArgument(['--port', 'abc'])).toThrow()
    expect(() => parsePortArgument(['--port', '0'])).toThrow()
    expect(() => parsePortArgument(['--port', '70000'])).toThrow()
    expect(() => parsePortArgument(['--port', '12.5'])).toThrow()
}

test('test_missing_port_flag_picks_auto_port', validateMissingFlagPicksAutoPort)
test('test_port_flag_gives_the_port', validateFlagGivesThePort)
test('test_bad_port_throws', validateBadPortThrows)
