/**
 * Glass surface guard: the opt-in exception to the no-glass rule. Every surface is defined, documented in DESIGN.md,
 * registered in the store and exported; the CSS is progressive enhancement (inside @supports), uses tokens only, falls
 * back to solid, and keeps surface text at 4.5:1 over the worst possible backdrop in every theme, palette and mode.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { THEME_SURFACES } from '../stores/theme'
import { color, over, presets, ratio, resolve as resolveTokens, rgbOf, stylesDir, type RGB } from './contrast-helpers'

const css = readFileSync(`${stylesDir}surfaces.css`, 'utf8')
const design = readFileSync(resolve(process.cwd(), '../../DESIGN.md'), 'utf8')
const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as { exports: Record<string, unknown> }
const code = css.replace(/\/\*[\s\S]*?\*\//g, '')

const SUPPORTS = '@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))'
const supportsStart = code.indexOf(SUPPORTS)
const open = code.indexOf('{', supportsStart)
let depth = 0
let close = -1
for (let i = open; i < code.length; i++) {
  if (code[i] === '{') depth++
  else if (code[i] === '}' && --depth === 0) {
    close = i
    break
  }
}
const inner = supportsStart < 0 ? '' : code.slice(open + 1, close)
const outside = supportsStart < 0 ? code : code.slice(0, supportsStart) + code.slice(close + 1)
const rules = [...inner.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1].trim().replace(/\s+/g, ' '), body: m[2] }))
const scopeRules = rules.filter((r) => /^\[data-surface="[a-z]+"\]$/.test(r.selector))
/** Rules that paint a surface: they set a fill from a surface token. */
const glassRules = rules.filter((r) => /background-color:\s*color-mix\(in oklch, var\(--[a-z-]+\)/.test(r.body))
const alphaOf = (body: string) => +body.match(/--glass-alpha:\s*([\d.]+);/)![1]
const GLASS_ALPHA = alphaOf(scopeRules.find((r) => r.selector.includes('"glass"'))!.body)

describe('glass surface: registry', () => {
  it('every store surface has exactly one scope rule and every scope rule is a store surface', () => {
    expect([...new Set(scopeRules.map((r) => r.selector.match(/"([a-z]+)"/)![1]))].sort()).toEqual([...THEME_SURFACES].sort())
  })
  it('solid restores the opaque surface (alpha 1, no blur) and glass sets the tunable defaults', () => {
    expect(scopeRules.find((r) => r.selector.includes('"solid"'))!.body).toMatch(/--glass-alpha:\s*1;[\s\S]*--glass-blur:\s*0px;/)
    const glass = scopeRules.find((r) => r.selector.includes('"glass"'))!.body
    expect(glass).toMatch(/--glass-alpha:\s*0?\.\d+;/)
    expect(glass).toMatch(/--glass-blur:\s*\d+px;/)
  })
  it('every surface is documented in DESIGN.md with a brief', () => {
    const section = design.slice(design.indexOf('## 13. Surfaces'))
    expect(section.length).toBeGreaterThan(300)
    for (const name of THEME_SURFACES) expect(section, name).toMatch(new RegExp(`\\| \`${name}\` \\|[^|]+\\|`))
  })
  it('the exception is recorded in DESIGN.md section 7 and the glass rule is reworded', () => {
    const exceptions = design.slice(design.indexOf('## 7. Deliberate exceptions'), design.indexOf('## 8. Style packs'))
    expect(exceptions).toMatch(/S4 glass[^\n]*`styles\/surfaces\.css`/)
    expect(design).toMatch(/glass exists only through `data-surface="glass"`/i)
  })
  it('is exported as @perfect-design/ui/surfaces.css', () => {
    expect(pkg.exports['./surfaces.css']).toBe('./src/styles/surfaces.css')
  })
})

describe('glass surface: fallbacks', () => {
  it('has the @supports block and nothing outside it', () => {
    expect(supportsStart).toBeGreaterThanOrEqual(0)
    expect(outside.trim()).toBe('')
  })
  it('every painting rule sets backdrop-filter with the -webkit- prefix too', () => {
    expect(glassRules.length).toBeGreaterThanOrEqual(3)
    for (const r of glassRules) {
      expect(r.body, r.selector).toMatch(/-webkit-backdrop-filter:\s*blur\(var\(--glass-blur\)\)\s*saturate\([\d.]+\);/)
      expect(r.body, r.selector).toMatch(/(?<!-)backdrop-filter:\s*blur\(var\(--glass-blur\)\)\s*saturate\([\d.]+\);/)
    }
  })
  it('prefers-reduced-transparency and forced colours return the solid surface', () => {
    const m = inner.match(/@media\s*\(prefers-reduced-transparency:\s*reduce\),\s*\(forced-colors:\s*active\)\s*\{\s*\[data-surface="glass"\]\s*\{([^{}]*)\}/)
    expect(m, 'reduced-transparency block').toBeTruthy()
    expect(m![1]).toMatch(/--glass-alpha:\s*1;/)
    expect(m![1]).toMatch(/--glass-blur:\s*0px;/)
  })
  it('the contrast style pack forces solid on the same element, an ancestor and a nested glass scope', () => {
    const r = rules.find((x) => x.selector.includes('[data-style="contrast"] [data-surface="glass"]'))
    expect(r).toBeTruthy()
    expect(r!.selector).toContain('[data-surface="glass"][data-style="contrast"]')
    expect(r!.selector).toMatch(/^\[data-style="contrast"\],/)
    expect(r!.body).toMatch(/--glass-alpha:\s*1;/)
    expect(r!.body).toMatch(/--glass-blur:\s*0px;/)
    const order = (sel: string) => rules.findIndex((x) => x.selector === sel)
    expect(rules.indexOf(r!)).toBeGreaterThan(order('[data-surface="glass"]'))
  })
  it('a tone border (danger, warning, success, info) is kept', () => {
    expect(rules.find((r) => r.selector.includes('[data-tone]') && /border-color:\s*revert-layer/.test(r.body))).toBeTruthy()
  })
})

describe('glass surface: safety rules', () => {
  it('uses tokens only: no colour literal, gradient or hard-coded blur', () => {
    expect(code).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|(?<!in )oklch\(|gradient\(|url\(|@import/)
    expect(code.replace(/blur\(var\(--glass-blur\)\)/g, '')).not.toMatch(/blur\((?!1px\))/)
  })
  it('has no shadow, motion or transform, and sets only fill, backdrop filter, border colour and glass properties', () => {
    expect(code).not.toMatch(/box-shadow|transition|animation|transform/)
    for (const r of rules) {
      const props = [...r.body.matchAll(/(?:^|;)\s*(-{0,2}[a-z][a-z-]*)\s*:/g)].map((m) => m[1])
      for (const p of props) expect(['--glass-alpha', '--glass-blur', 'background-color', 'backdrop-filter', '-webkit-backdrop-filter', 'border-color'], `${r.selector} sets ${p}`).toContain(p)
    }
  })
  it('paints only inside a glass scope, so nothing changes until the attribute is set', () => {
    for (const r of rules.filter((x) => /(?:^|;)\s*(?:background-color|backdrop-filter|-webkit-backdrop-filter|border-color)/.test(x.body))) {
      expect(r.selector, r.selector).toMatch(/^\[data-surface="glass"\] /)
    }
  })
  it('targets layers that float over content by their real data-slot names', () => {
    const files = import.meta.glob(['../components/**/*.vue', '!../**/*.test.ts'], { eager: true, query: '?raw', import: 'default' }) as Record<string, string>
    const sources = Object.values(files).join('\n')
    const slots = new Set(glassRules.flatMap((r) => [...r.selector.matchAll(/data-slot="([a-z-]+)"/g)].map((m) => m[1])))
    expect(slots.size).toBeGreaterThan(20)
    for (const s of slots) expect(sources, s).toContain(`data-slot="${s}"`)
    for (const s of ['popover-content', 'dropdown-menu-content', 'select-content', 'hover-card-content', 'tooltip-content', 'dialog-content', 'alert-dialog-content', 'sheet-content', 'toast', 'navigation-menu-viewport', 'app-header', 'site-header']) {
      expect(slots, s).toContain(s)
    }
  })
  it('keeps content cards opaque', () => {
    for (const r of glassRules) expect(r.selector, r.selector).not.toMatch(/data-slot="(?:card[a-z-]*|alert|callout[a-z-]*|banner[a-z-]*|table[a-z-]*|data-table[a-z-]*|stat[a-z-]*)"/)
  })
})

describe('glass surface: legibility gate', () => {
  // The surface fill is `color-mix(token alpha, transparent)`: the token at that alpha. The compositor blends it over
  // the blurred backdrop in sRGB. Luminance rises with every channel, so pure black and pure white are the worst
  // backdrops: any real page lies between them, and blur and saturate cannot push a backdrop outside that range.
  const BACKDROPS: Record<string, RGB> = { black: [0, 0, 0], white: [1, 1, 1] }
  /** Surface token -> the foreground the components draw on it. */
  const TEXT_ON: Record<string, string> = { popover: 'popover-foreground', background: 'foreground', foreground: 'background' }
  const surfaces = [...new Set(glassRules.map((r) => r.body.match(/background-color:\s*color-mix\(in oklch, var\(--([a-z-]+)\)/)![1]))]

  // Resolving tokens parses CSS; the alpha scan below calls this thousands of times.
  const resolved = new Map<string, ReturnType<typeof resolveTokens>>()
  const tokensOf = (mode: 'light' | 'dark', preset: string | null) => {
    const key = `${mode}/${preset}`
    if (!resolved.has(key)) resolved.set(key, resolveTokens(mode, preset))
    return resolved.get(key)!
  }
  const contrastOver = (mode: 'light' | 'dark', preset: string | null, bg: string, fg: string, alpha: number, backdrop: RGB) => {
    const t = tokensOf(mode, preset)
    const surface = over({ rgb: rgbOf(t, bg), alpha }, backdrop)
    return ratio(over(color(t, fg), surface), surface)
  }
  const worst = (alpha: number) => {
    let min = Infinity
    for (const mode of ['light', 'dark'] as const) for (const preset of presets) for (const bg of surfaces) for (const b of Object.values(BACKDROPS)) min = Math.min(min, contrastOver(mode, preset, bg, TEXT_ON[bg], alpha, b))
    return min
  }
  /** Lowest alpha, in steps of 0.01, at which every surface passes everywhere. */
  const lowestPassing = () => {
    for (let a = 0; a <= 100; a++) if (worst(a / 100) >= 4.5) return a / 100
    return NaN
  }

  it('every painted surface token has a known foreground', () => {
    expect(surfaces.sort()).toEqual(['background', 'foreground', 'popover'])
  })
  it.each(['light', 'dark'] as const)('%s: surface text is at least 4.5:1 over pure black and pure white in every theme and palette', (mode) => {
    for (const preset of presets) {
      for (const bg of surfaces) {
        for (const [name, b] of Object.entries(BACKDROPS)) {
          expect(contrastOver(mode, preset, bg, TEXT_ON[bg], GLASS_ALPHA, b), `${mode} ${preset ?? 'core'} ${TEXT_ON[bg]} on ${bg} over ${name}`).toBeGreaterThanOrEqual(4.5)
        }
      }
    }
  })
  it('the shipped alpha is the lowest that passes everywhere, plus a 0.01 margin for 8-bit rounding', () => {
    const lowest = lowestPassing()
    expect(Number.isNaN(lowest)).toBe(false)
    expect(GLASS_ALPHA).toBeGreaterThanOrEqual(lowest)
    expect(GLASS_ALPHA - lowest).toBeLessThanOrEqual(0.0100001)
  })
  it('the gate bites: a clearly lower alpha fails somewhere, a fully opaque surface equals the plain token pair', () => {
    expect(worst(GLASS_ALPHA - 0.1)).toBeLessThan(4.5)
    expect(worst(0.3)).toBeLessThan(3)
    expect(worst(1)).toBeGreaterThanOrEqual(4.5)
  })
  it('over the page background itself, every text colour of a surface stays at 4.5:1 (muted text, links)', () => {
    for (const mode of ['light', 'dark'] as const) {
      for (const preset of presets) {
        const t = tokensOf(mode, preset)
        const page = rgbOf(t, 'background')
        for (const [fg, bg] of [['muted-foreground', 'popover'], ['primary', 'popover'], ['muted-foreground', 'background'], ['primary', 'background']] as const) {
          const surface = over({ rgb: rgbOf(t, bg), alpha: GLASS_ALPHA }, page)
          expect(ratio(over(color(t, fg), surface), surface), `${mode} ${preset ?? 'core'} ${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5)
        }
      }
    }
  })
})
