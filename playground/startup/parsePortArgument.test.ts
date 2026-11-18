import { test, expect } from 'bun:test';
import { parsePortArgument } from './parsePortArgument';

function validateMissingFlagPicksAutoPort() {
    expect(parsePortArgument([])).toBe(0);
    expect(parsePortArgument(['playground.ts'])).toBe(0);
}

function validateFlagGivesThePort() {
    expect(parsePortArgument(['--port', '5000'])).toBe(5000);
}

function parseFlagWithoutValue() {
    return parsePortArgument(['--port']);
}

function parseFlagWithLetters() {
    return parsePortArgument(['--port', 'abc']);
}

function parseFlagWithZero() {
    return parsePortArgument(['--port', '0']);
}

function parseFlagAboveMaximum() {
    return parsePortArgument(['--port', '70000']);
}

function parseFlagWithDecimal() {
    return parsePortArgument(['--port', '12.5']);
}

function validateBadPortThrows() {
    expect(parseFlagWithoutValue).toThrow();
    expect(parseFlagWithLetters).toThrow();
    expect(parseFlagWithZero).toThrow();
    expect(parseFlagAboveMaximum).toThrow();
    expect(parseFlagWithDecimal).toThrow();
}

test('test_missing_port_flag_picks_auto_port', validateMissingFlagPicksAutoPort);
test('test_port_flag_gives_the_port', validateFlagGivesThePort);
test('test_bad_port_throws', validateBadPortThrows);
