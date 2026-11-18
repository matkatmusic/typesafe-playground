import { test, expect } from 'bun:test';
import { isRequestAllowed, listAllowedHosts } from './playgroundGuard';

function getHostname() {
    return '127.0.0.1';
}

function getPort() {
    return 4318;
}

function buildRequest(method: string, headers: Record<string, string>) {
    return new Request('http://127.0.0.1:4318/run', { method, headers });
}

function validateAllowedHostsUseHostnameAndLocalhost() {
    expect(listAllowedHosts(getHostname(), getPort())).toEqual(['127.0.0.1:4318', 'localhost:4318']);
}

function validateGetWithAllowedHostPasses() {
    expect(isRequestAllowed(buildRequest('GET', { host: '127.0.0.1:4318' }), getHostname(), getPort())).toBe(true);
    expect(isRequestAllowed(buildRequest('GET', { host: 'localhost:4318' }), getHostname(), getPort())).toBe(true);
}

function validatePostWithAllowedHostOriginAndJsonPasses() {
    const headers = { host: 'localhost:4318', origin: 'http://localhost:4318', 'content-type': 'application/json' };
    expect(isRequestAllowed(buildRequest('POST', headers), getHostname(), getPort())).toBe(true);
    const charsetHeaders = { host: '127.0.0.1:4318', origin: 'http://127.0.0.1:4318', 'content-type': 'application/json; charset=utf-8' };
    expect(isRequestAllowed(buildRequest('POST', charsetHeaders), getHostname(), getPort())).toBe(true);
}

function validateWrongHostFails() {
    expect(isRequestAllowed(buildRequest('GET', { host: 'evil.example:4318' }), getHostname(), getPort())).toBe(false);
    expect(isRequestAllowed(buildRequest('GET', { host: '127.0.0.1:9999' }), getHostname(), getPort())).toBe(false);
}

function validateForeignOriginFails() {
    const headers = { host: '127.0.0.1:4318', origin: 'https://evil.example', 'content-type': 'application/json' };
    expect(isRequestAllowed(buildRequest('POST', headers), getHostname(), getPort())).toBe(false);
}

function validateMissingOriginOnPostFails() {
    const headers = { host: '127.0.0.1:4318', 'content-type': 'application/json' };
    expect(isRequestAllowed(buildRequest('POST', headers), getHostname(), getPort())).toBe(false);
}

function validateTextPlainContentTypeFails() {
    const headers = { host: '127.0.0.1:4318', origin: 'http://127.0.0.1:4318', 'content-type': 'text/plain' };
    expect(isRequestAllowed(buildRequest('POST', headers), getHostname(), getPort())).toBe(false);
}

function validateLanHostPassesOnlyWhenItIsInThePassedList() {
    const getHeaders = { host: '192.168.1.20:4318' };
    const postHeaders = { host: '192.168.1.20:4318', origin: 'http://192.168.1.20:4318', 'content-type': 'application/json' };
    expect(listAllowedHosts(getHostname(), getPort(), ['192.168.1.20'])).toEqual(['127.0.0.1:4318', 'localhost:4318', '192.168.1.20:4318']);
    expect(isRequestAllowed(buildRequest('GET', getHeaders), getHostname(), getPort(), ['192.168.1.20'])).toBe(true);
    expect(isRequestAllowed(buildRequest('POST', postHeaders), getHostname(), getPort(), ['192.168.1.20'])).toBe(true);
    expect(isRequestAllowed(buildRequest('GET', getHeaders), getHostname(), getPort(), ['10.0.0.5'])).toBe(false);
}

function validateLanHostIsRefusedWithoutTheLanList() {
    const postHeaders = { host: '192.168.1.20:4318', origin: 'http://192.168.1.20:4318', 'content-type': 'application/json' };
    expect(isRequestAllowed(buildRequest('GET', { host: '192.168.1.20:4318' }), getHostname(), getPort())).toBe(false);
    expect(isRequestAllowed(buildRequest('POST', postHeaders), getHostname(), getPort())).toBe(false);
}

test('test_lan_host_passes_only_when_it_is_in_the_passed_list', validateLanHostPassesOnlyWhenItIsInThePassedList);
test('test_lan_host_is_refused_without_the_lan_list', validateLanHostIsRefusedWithoutTheLanList);
test('test_allowed_hosts_use_hostname_and_localhost', validateAllowedHostsUseHostnameAndLocalhost);
test('test_get_with_allowed_host_passes', validateGetWithAllowedHostPasses);
test('test_post_with_allowed_host_origin_and_json_passes', validatePostWithAllowedHostOriginAndJsonPasses);
test('test_wrong_host_fails', validateWrongHostFails);
test('test_foreign_origin_fails', validateForeignOriginFails);
test('test_missing_origin_on_post_fails', validateMissingOriginOnPostFails);
test('test_text_plain_content_type_fails', validateTextPlainContentTypeFails);
