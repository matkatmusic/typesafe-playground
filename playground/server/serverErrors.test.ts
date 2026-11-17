import { test, expect } from 'bun:test'
import { buildErrorResponse, hideKeysInMessage, setLastTypedKey } from './serverErrors'

const ENV_KEY = 'env-secret-123'
const TYPED_KEY = 'typed-secret-456'

function validateEnvKeyAndTypedKeyAreHidden() {
    Bun.env.TYPESAFE_API_KEY = ENV_KEY
    setLastTypedKey(TYPED_KEY)
    const message = `bad key ${ENV_KEY} and ${TYPED_KEY} and ${ENV_KEY}`
    expect(hideKeysInMessage(message)).toBe('bad key [key hidden] and [key hidden] and [key hidden]')
}

function validateEmptyKeysLeaveTheMessageAlone() {
    Bun.env.TYPESAFE_API_KEY = ''
    setLastTypedKey('')
    expect(hideKeysInMessage('plain message')).toBe('plain message')
}

async function validateErrorResponseIs500WithHiddenKeys() {
    Bun.env.TYPESAFE_API_KEY = ENV_KEY
    setLastTypedKey(TYPED_KEY)
    const response = buildErrorResponse(new Error(`failed with ${TYPED_KEY}`))
    expect(response.status).toBe(500)
    expect(await response.text()).toBe('failed with [key hidden]')
}

test('test_env_key_and_typed_key_are_hidden_in_messages', validateEnvKeyAndTypedKeyAreHidden)
test('test_empty_keys_leave_the_message_alone', validateEmptyKeysLeaveTheMessageAlone)
test('test_error_response_is_500_with_hidden_keys', validateErrorResponseIs500WithHiddenKeys)
