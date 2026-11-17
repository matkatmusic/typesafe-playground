import { test, expect } from 'bun:test'
import type { NetworkInterfaceInfo } from 'node:os'
import { formatServerUrls, listLanAddresses } from './lanAddresses'

function buildInfo(address: string, family: string, internal: boolean): NetworkInterfaceInfo {
    return { address, family, internal } as NetworkInterfaceInfo
}

function validateOnlyExternalIpv4AddressesAreListed() {
    const interfaces = {
        lo0: [buildInfo('127.0.0.1', 'IPv4', true), buildInfo('::1', 'IPv6', true)],
        en0: [buildInfo('fe80::1', 'IPv6', false), buildInfo('192.168.1.20', 'IPv4', false)],
        en1: [buildInfo('10.0.0.5', 'IPv4', false)],
        utun0: undefined,
    }
    expect(listLanAddresses(interfaces)).toEqual(['192.168.1.20', '10.0.0.5'])
}

function validateServerUrlsStartWithTheLocalOneThenEachLanAddress() {
    expect(formatServerUrls('127.0.0.1', 4318, [])).toEqual(['http://127.0.0.1:4318/'])
    expect(formatServerUrls('127.0.0.1', 4318, ['192.168.1.20'])).toEqual(['http://127.0.0.1:4318/', 'http://192.168.1.20:4318/'])
}

test('test_only_external_ipv4_addresses_are_listed', validateOnlyExternalIpv4AddressesAreListed)
test('test_server_urls_start_with_the_local_one_then_each_lan_address', validateServerUrlsStartWithTheLocalOneThenEachLanAddress)
