import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

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
export const THEME_STORAGE_KEY = 'pd-theme'

interface Persisted {
  mode?: unknown
  accent?: unknown
  style?: unknown
}

function isMode(v: unknown): v is ThemeMode {
  return v === 'light' || v === 'dark' || v === 'system'
}
function isAccent(v: unknown): v is ThemeAccent {
  return typeof v === 'string' && (THEME_ACCENTS as readonly string[]).includes(v)
}

function isStyle(v: unknown): v is ThemeStyle {
  return typeof v === 'string' && (THEME_STYLES as readonly string[]).includes(v)
}

function readPersisted(): Persisted {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(THEME_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Persisted) : {}
  } catch {
    return {} // corrupt JSON or storage blocked
  }
}

/**
 * Theme state: colour mode (light/dark/system), accent preset and style pack. Persists to localStorage and applies
 * `class="dark"`, `data-theme` and `data-style` to <html>. Call `init()` once at app start (or rely on ThemeProvider).
 */
export const useThemeStore = defineStore('pd-theme', () => {
  const saved = readPersisted()
  const mode = ref<ThemeMode>(isMode(saved.mode) ? saved.mode : 'system')
  const accent = ref<ThemeAccent>(isAccent(saved.accent) ? saved.accent : 'default')
  const style = ref<ThemeStyle>(isStyle(saved.style) ? saved.style : 'quiet')
  const systemDark = ref(false)

  const resolved = computed<'light' | 'dark'>(() => (mode.value === 'system' ? (systemDark.value ? 'dark' : 'light') : mode.value))
  const isDark = computed(() => resolved.value === 'dark')

  function apply() {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.classList.toggle('dark', isDark.value)
    if (accent.value === 'default') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', accent.value)
    if (style.value === 'quiet') root.removeAttribute('data-style')
    else root.setAttribute('data-style', style.value)
  }

  function persist() {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ mode: mode.value, accent: accent.value, style: style.value }))
    } catch {
      /* storage unavailable: theme still applies for this session */
    }
  }

  function setMode(next: ThemeMode) {
    if (!isMode(next)) return
    mode.value = next
  }
  function setAccent(next: ThemeAccent) {
    if (!isAccent(next)) return
    accent.value = next
  }
  function setStyle(next: ThemeStyle) {
    if (!isStyle(next)) return
    style.value = next
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
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      systemDark.value = mq.matches
      mq.addEventListener?.('change', (e) => (systemDark.value = e.matches))
    }
    watch([mode, accent, style, systemDark], () => {
      apply()
      persist()
    })
    apply()
  }

  return { mode, accent, style, resolved, isDark, setMode, setAccent, setStyle, cycleMode, toggle, init }
})
