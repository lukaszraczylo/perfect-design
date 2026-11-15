import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { THEME_STORAGE_KEY, THEME_STYLES, useThemeStore } from './theme'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ''
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('data-style')
  setActivePinia(createPinia())
})

describe('useThemeStore', () => {
  it('defaults to system mode + default accent (resolved light when OS is light)', () => {
    const s = useThemeStore()
    expect(s.mode).toBe('system')
    expect(s.accent).toBe('default')
    expect(s.resolved).toBe('light')
    expect(s.isDark).toBe(false)
  })

  it('init applies dark class and data-theme, and persists', async () => {
    const s = useThemeStore()
    s.init()
    s.setMode('dark')
    s.setAccent('emerald')
    await nextTick()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('emerald')
    expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY)!)).toEqual({ mode: 'dark', accent: 'emerald', style: 'quiet' })
  })

  it('removes data-theme for the default accent', async () => {
    const s = useThemeStore()
    s.init()
    s.setAccent('rose')
    await nextTick()
    s.setAccent('default')
    await nextTick()
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('ignores invalid mode/accent values', () => {
    const s = useThemeStore()
    // @ts-expect-error invalid on purpose
    s.setMode('purple')
    // @ts-expect-error invalid on purpose
    s.setAccent('nope')
    expect(s.mode).toBe('system')
    expect(s.accent).toBe('default')
  })

  it('restores persisted values', () => {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ mode: 'dark', accent: 'indigo' }))
    const s = useThemeStore()
    expect(s.mode).toBe('dark')
    expect(s.accent).toBe('indigo')
  })

  it('survives corrupt or invalid persisted data', () => {
    localStorage.setItem(THEME_STORAGE_KEY, '{not json')
    expect(useThemeStore().mode).toBe('system')
    setActivePinia(createPinia())
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ mode: 5, accent: 'zzz' }))
    const s = useThemeStore()
    expect(s.mode).toBe('system')
    expect(s.accent).toBe('default')
  })

  it('cycleMode goes light → dark → system → light; toggle flips resolved', () => {
    const s = useThemeStore()
    s.setMode('light')
    s.cycleMode()
    expect(s.mode).toBe('dark')
    s.cycleMode()
    expect(s.mode).toBe('system')
    s.cycleMode()
    expect(s.mode).toBe('light')
    s.toggle()
    expect(s.mode).toBe('dark')
    s.toggle()
    expect(s.mode).toBe('light')
  })

  it('follows the OS preference in system mode', async () => {
    let listener: ((e: { matches: boolean }) => void) | undefined
    const spy = vi.spyOn(window, 'matchMedia').mockImplementation(
      () =>
        ({
          matches: true,
          addEventListener: (_: string, cb: typeof listener) => (listener = cb),
        }) as unknown as MediaQueryList,
    )
    const s = useThemeStore()
    s.init()
    expect(s.resolved).toBe('dark')
    listener!({ matches: false })
    expect(s.resolved).toBe('light')
    spy.mockRestore()
  })

  it('init is idempotent and still works when storage throws', async () => {
    const s = useThemeStore()
    s.init()
    s.init()
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    s.setMode('dark')
    await nextTick()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    spy.mockRestore()
  })

  describe('style packs', () => {
    it('defaults to quiet and sets no data-style attribute', async () => {
      const s = useThemeStore()
      s.init()
      await nextTick()
      expect(s.style).toBe('quiet')
      expect(document.documentElement.hasAttribute('data-style')).toBe(false)
    })
    it.each(THEME_STYLES.filter((x) => x !== 'quiet'))('setStyle(%s) sets data-style on <html> and persists', async (style) => {
      const s = useThemeStore()
      s.init()
      s.setStyle(style)
      await nextTick()
      expect(document.documentElement.getAttribute('data-style')).toBe(style)
      expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY)!).style).toBe(style)
    })
    it('returning to quiet removes the attribute', async () => {
      const s = useThemeStore()
      s.init()
      s.setStyle('raw')
      await nextTick()
      s.setStyle('quiet')
      await nextTick()
      expect(document.documentElement.hasAttribute('data-style')).toBe(false)
    })
    it('ignores unknown styles', () => {
      const s = useThemeStore()
      // @ts-expect-error invalid on purpose
      s.setStyle('neon')
      expect(s.style).toBe('quiet')
    })
    it('restores a persisted style and ignores an invalid one', () => {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ style: 'terminal' }))
      expect(useThemeStore().style).toBe('terminal')
      setActivePinia(createPinia())
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ style: 'neon' }))
      expect(useThemeStore().style).toBe('quiet')
    })
    it('data persisted before styles existed still loads', () => {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ mode: 'dark', accent: 'rose' }))
      const s = useThemeStore()
      expect([s.mode, s.accent, s.style]).toEqual(['dark', 'rose', 'quiet'])
    })
  })
})
