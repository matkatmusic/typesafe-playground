import { test, expect, afterEach } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { buildPage } from './playground'
import { initHistory } from './playgroundHistory'

const savedSubqKey = Bun.env.SUBQ_AI_API_KEY

afterEach(() => {
    Bun.env.SUBQ_AI_API_KEY = savedSubqKey
})

async function buildTempHistoryPath() {
    const historyPath = `${mkdtempSync(`${tmpdir()}/playground-subq-page-`)}/results/playground-history.json`
    await initHistory(historyPath)
    return historyPath
}

async function validatePageDataSaysWhetherASubqEnvKeyExists() {
    const historyPath = await buildTempHistoryPath()
    Bun.env.SUBQ_AI_API_KEY = 'subq-env'
    expect((await buildPage(historyPath)).includes('"hasSubqEnvKey":true')).toBe(true)
    Bun.env.SUBQ_AI_API_KEY = '  '
    expect((await buildPage(historyPath)).includes('"hasSubqEnvKey":false')).toBe(true)
    delete Bun.env.SUBQ_AI_API_KEY
    expect((await buildPage(historyPath)).includes('"hasSubqEnvKey":false')).toBe(true)
}

test('test_page_data_says_whether_a_subq_env_key_exists', validatePageDataSaysWhetherASubqEnvKeyExists)
