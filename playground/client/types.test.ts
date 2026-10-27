import { test, expect } from 'bun:test'
import type { ThemeName } from './types'

function validateThemeNameAcceptsDarkAndLight() {
    const themeNames: ThemeName[] = ['dark', 'light']
    expect(themeNames.length).toBe(2)
}

test('test_theme_name_accepts_dark_and_light', validateThemeNameAcceptsDarkAndLight)
