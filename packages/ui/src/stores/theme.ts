import { defineStore } from 'pinia'
import { computed, ref, watch, type Ref } from 'vue'
import { CODE_THEMES, type CodeTheme } from '../lib/code-themes'
import { THEME_PALETTES, type ThemePalette } from '../lib/palettes'

export type ThemeMode = 'light' | 'dark' | 'system'
/** Accent presets shipped in `@perfect-design/ui/themes/<name>.css`. `default` is the core petrol theme; `indigo`, `violet` and `lime` are brand exceptions (see DESIGN.md section 7). */
export type ThemeAccent = 'default' | 'indigo' | 'emerald' | 'rose' | 'amber' | 'lime' | 'violet' | 'cyan'

export const THEME_ACCENTS: readonly ThemeAccent[] = ['default', 'indigo', 'emerald', 'rose', 'amber', 'lime', 'violet', 'cyan']
/**
 * Style packs shipped in `@perfect-design/ui/packs/<name>.css`, applied with `data-style`. `quiet` is the core look and
 * needs no CSS. Each pack is justified in DESIGN.md ("Style packs").
 */
export type ThemeStyle = 'quiet' | 'workbench' | 'tactile' | 'editorial' | 'raw' | 'contrast' | 'terminal'
export const THEME_STYLES: readonly ThemeStyle[] = ['quiet', 'workbench', 'tactile', 'editorial', 'raw', 'contrast', 'terminal']
/**
 * Font families shipped in `@perfect-design/ui/fonts.css`, applied with `data-font`. `default` is the core IBM Plex Sans
 * stack and needs no attribute. Every other family is a platform font stack, so no font file ships.
 */
export type ThemeFont = 'default' | 'system' | 'humanist' | 'geometric' | 'grotesque' | 'rounded' | 'serif' | 'slab' | 'mono'
export const THEME_FONTS: readonly ThemeFont[] = ['default', 'system', 'humanist', 'geometric', 'grotesque', 'rounded', 'serif', 'slab', 'mono']
/**
 * Corner shapes shipped in `@perfect-design/ui/corners.css`, applied with `data-corner`. `round` is the core look and
 * needs no attribute; `squircle` gives continuous corners in browsers that support `corner-shape`.
 */
export type ThemeCorner = 'round' | 'squircle'
export const THEME_CORNERS: readonly ThemeCorner[] = ['round', 'squircle']
/** Code colour themes (`@perfect-design/ui/code-themes.css`, `data-code-theme`); `default` follows the palette or the core tokens. */
export type ThemeCodeTheme = 'default' | CodeTheme
export const THEME_CODE_THEMES: readonly ThemeCodeTheme[] = ['default', ...CODE_THEMES]
export const THEME_STORAGE_KEY = 'pd-theme'

/** Every setting that maps to one attribute on <html>; the first value of each list is the default and removes the attribute. */
const ATTRIBUTE_SETTINGS = {
  accent: { attr: 'data-theme', values: THEME_ACCENTS },
  style: { attr: 'data-style', values: THEME_STYLES },
  font: { attr: 'data-font', values: THEME_FONTS },
  corner: { attr: 'data-corner', values: THEME_CORNERS },
  palette: { attr: 'data-palette', values: THEME_PALETTES },
  codeTheme: { attr: 'data-code-theme', values: THEME_CODE_THEMES },
} as const
type SettingName = keyof typeof ATTRIBUTE_SETTINGS
/** Attribute names and accepted values, for code that applies the theme outside Pinia (the boot script). */
export const THEME_ATTRIBUTES: Readonly<Record<SettingName, { attr: string; values: readonly string[] }>> = ATTRIBUTE_SETTINGS

function isMode(v: unknown): v is ThemeMode {
  return v === 'light' || v === 'dark' || v === 'system'
}
const isValue = (name: SettingName, v: unknown): boolean => typeof v === 'string' && (ATTRIBUTE_SETTINGS[name].values as readonly string[]).includes(v)

function readPersisted(): Record<string, unknown> {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(THEME_STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {} // corrupt JSON or storage blocked
  }
}

/**
 * Theme state: colour mode (light/dark/system), accent preset, palette, style pack, font family, corner shape and code theme. Persists to
 * localStorage (read in `init()`, not at creation, so SSR and hydration agree) and applies `class="dark"` and one data
 * attribute per setting to <html>. A palette and an accent both set the primary colour, so choosing one resets the other.
 * Call `init()` once at app start (or rely on ThemeProvider).
 */
export const useThemeStore = defineStore('pd-theme', () => {
  // Defaults until init(): reading storage at creation makes the first client render differ from the server HTML.
  const mode = ref<ThemeMode>('system')
  const accent = ref<ThemeAccent>('default')
  const style = ref<ThemeStyle>('quiet')
  const font = ref<ThemeFont>('default')
  const corner = ref<ThemeCorner>('round')
  const palette = ref<ThemePalette>('default')
  const codeTheme = ref<ThemeCodeTheme>('default')
  const settings: Record<SettingName, Ref<string>> = { accent, style, font, corner, palette, codeTheme }
  const systemDark = ref(false)

  const resolved = computed<'light' | 'dark'>(() => (mode.value === 'system' ? (systemDark.value ? 'dark' : 'light') : mode.value))
  const isDark = computed(() => resolved.value === 'dark')

  function apply() {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.classList.toggle('dark', isDark.value)
    for (const name of Object.keys(ATTRIBUTE_SETTINGS) as SettingName[]) {
      const { attr, values } = ATTRIBUTE_SETTINGS[name]
      const value = settings[name].value
      if (value === values[0]) root.removeAttribute(attr)
      else root.setAttribute(attr, value)
    }
  }

  function persist() {
    try {
      const state = Object.fromEntries((Object.keys(settings) as SettingName[]).map((name) => [name, settings[name].value]))
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ mode: mode.value, ...state }))
    } catch {
      /* storage unavailable: theme still applies for this session */
    }
  }

  const setter =
    <T extends string>(name: SettingName) =>
    (next: T) => {
      if (isValue(name, next)) settings[name].value = next
    }

  function setMode(next: ThemeMode) {
    if (!isMode(next)) return
    mode.value = next
  }
  const setStyle = setter<ThemeStyle>('style')
  const setFont = setter<ThemeFont>('font')
  const setCorner = setter<ThemeCorner>('corner')
  const setCodeTheme = setter<ThemeCodeTheme>('codeTheme')
  function setAccent(next: ThemeAccent) {
    if (!isValue('accent', next)) return
    accent.value = next
    if (next !== 'default') palette.value = 'default'
  }
  function setPalette(next: ThemePalette) {
    if (!isValue('palette', next)) return
    palette.value = next
    if (next !== 'default') accent.value = 'default'
  }
  /** light → dark → system → light */
  function cycleMode() {
    mode.value = mode.value === 'light' ? 'dark' : mode.value === 'dark' ? 'system' : 'light'
  }
  function toggle() {
    mode.value = isDark.value ? 'light' : 'dark'
  }

  let started = false
  function init() {
    if (started) return
    started = true
    const saved = readPersisted()
    if (isMode(saved.mode)) mode.value = saved.mode
    for (const name of Object.keys(settings) as SettingName[]) if (isValue(name, saved[name])) settings[name].value = saved[name] as string
    // A stored state from before the two were exclusive may hold both; the palette wins, as it does in CSS.
    if (palette.value !== 'default') accent.value = 'default'
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      systemDark.value = mq.matches
      mq.addEventListener?.('change', (e) => (systemDark.value = e.matches))
    }
    watch([mode, accent, style, font, corner, palette, codeTheme, systemDark], () => {
      apply()
      persist()
    })
    apply()
  }

  return { mode, accent, style, font, corner, palette, codeTheme, resolved, isDark, setMode, setAccent, setStyle, setFont, setCorner, setPalette, setCodeTheme, cycleMode, toggle, init }
})
