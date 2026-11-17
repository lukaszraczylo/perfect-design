import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { THEME_FONTS, THEME_STORAGE_KEY, THEME_STYLES, useThemeStore } from './theme'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ''
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('data-style')
  document.documentElement.removeAttribute('data-font')
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
    expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY)!)).toEqual({ mode: 'dark', accent: 'emerald', style: 'quiet', font: 'default', palette: 'default', codeTheme: 'default' })
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

  it('creation ignores persisted values (first client render matches server HTML) and init restores them', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ mode: 'dark', accent: 'indigo', style: 'raw' }))
    const s = useThemeStore()
    expect([s.mode, s.accent, s.style]).toEqual(['system', 'default', 'quiet'])
    s.init()
    expect([s.mode, s.accent, s.style]).toEqual(['dark', 'indigo', 'raw'])
    await nextTick()
    expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY)!)).toEqual({ mode: 'dark', accent: 'indigo', style: 'raw' })
    expect(document.documentElement.getAttribute('data-theme')).toBe('indigo')
  })

  it('survives corrupt or invalid persisted data', () => {
    localStorage.setItem(THEME_STORAGE_KEY, '{not json')
    const first = useThemeStore()
    first.init()
    expect(first.mode).toBe('system')
    setActivePinia(createPinia())
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ mode: 5, accent: 'zzz' }))
    const s = useThemeStore()
    s.init()
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
    it('init restores a persisted style and ignores an invalid one', () => {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ style: 'terminal' }))
      const a = useThemeStore()
      a.init()
      expect(a.style).toBe('terminal')
      setActivePinia(createPinia())
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ style: 'neon' }))
      const b = useThemeStore()
      b.init()
      expect(b.style).toBe('quiet')
    })
    it('data persisted before styles existed still loads on init', () => {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ mode: 'dark', accent: 'rose' }))
      const s = useThemeStore()
      s.init()
      expect([s.mode, s.accent, s.style]).toEqual(['dark', 'rose', 'quiet'])
    })
  })
  describe('font families', () => {
    it('defaults to default and sets no data-font attribute', async () => {
      const s = useThemeStore()
      s.init()
      await nextTick()
      expect(s.font).toBe('default')
      expect(document.documentElement.hasAttribute('data-font')).toBe(false)
    })
    it.each(THEME_FONTS.filter((x) => x !== 'default'))('setFont(%s) sets data-font on <html> and persists', async (font) => {
      const s = useThemeStore()
      s.init()
      s.setFont(font)
      await nextTick()
      expect(document.documentElement.getAttribute('data-font')).toBe(font)
      expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY)!).font).toBe(font)
    })
    it('returning to default removes the attribute', async () => {
      const s = useThemeStore()
      s.init()
      s.setFont('serif')
      await nextTick()
      s.setFont('default')
      await nextTick()
      expect(document.documentElement.hasAttribute('data-font')).toBe(false)
    })
    it('is independent of the style pack and accent', async () => {
      const s = useThemeStore()
      s.init()
      s.setStyle('terminal')
      s.setFont('serif')
      await nextTick()
      expect(document.documentElement.getAttribute('data-style')).toBe('terminal')
      expect(document.documentElement.getAttribute('data-font')).toBe('serif')
      s.setStyle('quiet')
      await nextTick()
      expect(document.documentElement.getAttribute('data-font')).toBe('serif')
    })
    it('ignores unknown fonts', () => {
      const s = useThemeStore()
      // @ts-expect-error invalid on purpose
      s.setFont('comic')
      expect(s.font).toBe('default')
    })
    // Saved values are read in init(), so the first client render matches the server.
    const restored = () => {
      const s = useThemeStore()
      s.init()
      return s
    }
    it('restores a persisted font and ignores an invalid or non-string one', () => {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ font: 'slab' }))
      expect(restored().font).toBe('slab')
      setActivePinia(createPinia())
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ font: 'comic' }))
      expect(restored().font).toBe('default')
      setActivePinia(createPinia())
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ font: 7 }))
      expect(restored().font).toBe('default')
    })
    it('data persisted before fonts existed still loads', () => {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ mode: 'dark', accent: 'rose', style: 'raw' }))
      const s = restored()
      expect([s.mode, s.accent, s.style, s.font, s.palette, s.codeTheme]).toEqual(['dark', 'rose', 'raw', 'default', 'default', 'default'])
    })
  })
})

describe('useThemeStore palettes and code themes', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    for (const a of ['data-theme', 'data-palette', 'data-code-theme', 'data-font', 'data-style']) document.documentElement.removeAttribute(a)
  })

  it('applies data-palette and data-code-theme and removes them for the default', async () => {
    const s = useThemeStore()
    s.init()
    s.setPalette('harbor')
    s.setCodeTheme('midnight')
    await nextTick()
    expect(document.documentElement.getAttribute('data-palette')).toBe('harbor')
    expect(document.documentElement.getAttribute('data-code-theme')).toBe('midnight')
    s.setPalette('default')
    s.setCodeTheme('default')
    await nextTick()
    expect(document.documentElement.hasAttribute('data-palette')).toBe(false)
    expect(document.documentElement.hasAttribute('data-code-theme')).toBe(false)
  })

  it('a palette and an accent are exclusive: choosing one resets the other', () => {
    const s = useThemeStore()
    s.setAccent('rose')
    s.setPalette('graphite')
    expect([s.palette, s.accent]).toEqual(['graphite', 'default'])
    s.setAccent('emerald')
    expect([s.palette, s.accent]).toEqual(['default', 'emerald'])
    s.setPalette('default')
    expect(s.accent).toBe('emerald')
  })

  it.each([
    ['unknown palette', () => useThemeStore().setPalette('neon' as never), 'palette', 'default'],
    ['unknown code theme', () => useThemeStore().setCodeTheme('neon' as never), 'codeTheme', 'default'],
  ] as const)('ignores an %s', (_label, act, key, want) => {
    act()
    expect(useThemeStore()[key]).toBe(want)
  })

  it('restores palette and code theme in init, and a stored palette wins over a stored accent', () => {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ accent: 'rose', palette: 'saffron', codeTheme: 'dawn' }))
    const s = useThemeStore()
    expect(s.palette).toBe('default')
    s.init()
    expect([s.palette, s.accent, s.codeTheme]).toEqual(['saffron', 'default', 'dawn'])
  })

  it('persists every setting', async () => {
    const s = useThemeStore()
    s.init()
    s.setPalette('nocturne')
    s.setFont('serif')
    s.setCodeTheme('fjord')
    await nextTick()
    expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY)!)).toMatchObject({ palette: 'nocturne', font: 'serif', codeTheme: 'fjord', accent: 'default' })
  })
})
