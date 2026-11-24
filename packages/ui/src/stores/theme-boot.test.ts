import { afterEach, describe, expect, it, vi } from 'vitest'
import { THEME_STORAGE_KEY, themeBootScript } from './index'

const root = document.documentElement
const run = (saved: unknown, prefersDark = false) => {
  if (saved === undefined) localStorage.removeItem(THEME_STORAGE_KEY)
  else localStorage.setItem(THEME_STORAGE_KEY, typeof saved === 'string' ? saved : JSON.stringify(saved))
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: prefersDark } as MediaQueryList)
  new Function(themeBootScript)()
  return { dark: root.classList.contains('dark'), theme: root.getAttribute('data-theme'), style: root.getAttribute('data-style'), palette: root.getAttribute('data-palette'), font: root.getAttribute('data-font'), corner: root.getAttribute('data-corner'), code: root.getAttribute('data-code-theme') }
}

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  root.classList.remove('dark')
  root.removeAttribute('data-theme')
  for (const a of ['data-style', 'data-palette', 'data-font', 'data-corner', 'data-code-theme']) root.removeAttribute(a)
})

describe('themeBootScript', () => {
  it.each([
    { name: 'saved dark, accent and pack', saved: { mode: 'dark', accent: 'emerald', style: 'workbench' }, prefersDark: false, want: { dark: true, theme: 'emerald', style: 'workbench', palette: null, font: null, corner: null, code: null } },
    { name: 'system mode follows the OS', saved: { mode: 'system' }, prefersDark: true, want: { dark: true, theme: null, style: null, palette: null, font: null, corner: null, code: null } },
    { name: 'nothing saved, light OS', saved: undefined, prefersDark: false, want: { dark: false, theme: null, style: null, palette: null, font: null, corner: null, code: null } },
    { name: 'explicit light beats a dark OS', saved: { mode: 'light' }, prefersDark: true, want: { dark: false, theme: null, style: null, palette: null, font: null, corner: null, code: null } },
    { name: 'defaults set no attribute', saved: { mode: 'light', accent: 'default', style: 'quiet' }, prefersDark: false, want: { dark: false, theme: null, style: null, palette: null, font: null, corner: null, code: null } },
    { name: 'unknown values are ignored', saved: { accent: 'x" onload="alert(1)', style: 'neon' }, prefersDark: false, want: { dark: false, theme: null, style: null, palette: null, font: null, corner: null, code: null } },
    { name: 'corrupt JSON is ignored', saved: '{not json', prefersDark: false, want: { dark: false, theme: null, style: null, palette: null, font: null, corner: null, code: null } },
    { name: 'palette, font and code theme', saved: { palette: 'harbor', font: 'serif', codeTheme: 'midnight' }, prefersDark: false, want: { dark: false, theme: null, style: null, palette: 'harbor', font: 'serif', corner: null, code: 'midnight' } },
    { name: 'corner shape', saved: { corner: 'squircle' }, prefersDark: false, want: { dark: false, theme: null, style: null, palette: null, font: null, corner: 'squircle', code: null } },
    { name: 'the default corner sets no attribute', saved: { corner: 'round' }, prefersDark: false, want: { dark: false, theme: null, style: null, palette: null, font: null, corner: null, code: null } },
    { name: 'a stored palette wins over a stored accent', saved: { accent: 'rose', palette: 'graphite' }, prefersDark: false, want: { dark: false, theme: null, style: null, palette: 'graphite', font: null, corner: null, code: null } },
  ])('$name', ({ saved, prefersDark, want }) => {
    expect(run(saved, prefersDark)).toEqual(want)
  })

  it('survives blocked storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(() => new Function(themeBootScript)()).not.toThrow()
  })

  it('contains no closing script tag', () => {
    expect(themeBootScript).not.toMatch(/<\/script/i)
  })
})
