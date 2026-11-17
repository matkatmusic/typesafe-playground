import { test, expect } from 'bun:test'
import { isLanArgument } from './parseLanArgument'

function validateLanFlagIsFoundOnlyWhenGiven() {
    expect(isLanArgument([])).toBe(false)
    expect(isLanArgument(['playground.ts', '--port', '5000'])).toBe(false)
    expect(isLanArgument(['playground.ts', '--lan'])).toBe(true)
    expect(isLanArgument(['--port', '5000', '--lan'])).toBe(true)
}

test('test_lan_flag_is_found_only_when_given', validateLanFlagIsFoundOnlyWhenGiven)
