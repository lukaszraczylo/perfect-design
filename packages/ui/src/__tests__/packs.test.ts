/**
 * Style packs guard: every pack is defined, documented in DESIGN.md, registered in the store and stays inside the
 * slop rules (no gradient, blur, glow, hard-coded colour; motion only when allowed). Contrast packs keep their ratios.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { THEME_STYLES } from '../stores/theme'

const stylesDir = resolve(process.cwd(), 'src/styles')
const packFiles = readdirSync(`${stylesDir}/packs`).filter((f) => f.endsWith('.css')).sort()
const css = Object.fromEntries(packFiles.map((f) => [f.replace('.css', ''), readFileSync(`${stylesDir}/packs/${f}`, 'utf8')]))
const theme = readFileSync(`${stylesDir}/theme.css`, 'utf8')
const design = readFileSync(resolve(process.cwd(), '../../DESIGN.md'), 'utf8')
const packsIndex = readFileSync(`${stylesDir}/packs.css`, 'utf8')
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '')

describe('style packs: registry', () => {
  it('every store style has a CSS file and every CSS file is a store style', () => {
    expect(Object.keys(css).sort()).toEqual([...THEME_STYLES].sort())
  })
  it('packs.css imports every pack once', () => {
    for (const name of THEME_STYLES) expect(packsIndex.match(new RegExp(`packs/${name}\\.css`, 'g'))?.length, name).toBe(1)
  })
  it('every pack is documented in DESIGN.md section 8 with a brief', () => {
    const section = design.slice(design.indexOf('## 8. Style packs'))
    expect(section.length).toBeGreaterThan(500)
    for (const name of THEME_STYLES) expect(section, name).toMatch(new RegExp(`\\| \`${name}\` \\|[^|]+\\|`))
  })
  it('each pack file scopes every rule to its own data-style', () => {
    for (const [name, text] of Object.entries(css)) {
      const selectors = [...stripComments(text).matchAll(/([^{}]+)\{/g)].map((m) => m[1].trim()).filter((s) => !s.startsWith('@'))
      expect(selectors.length, name).toBeGreaterThan(0)
      for (const sel of selectors) expect(sel, `${name}: ${sel}`).toContain(`[data-style="${name}"]`)
    }
  })
})

describe('style packs: slop and safety rules', () => {
  it.each(Object.entries(css))('%s: no gradient, blur, glow, backdrop or hard-coded colour', (name, text) => {
    const code = stripComments(text)
    expect(code, name).not.toMatch(/gradient\(|backdrop-filter|filter:\s*blur|blur\(/)
    expect(code, name).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/)
  })
  it.each(Object.entries(css))('%s: transform and transition only inside prefers-reduced-motion: no-preference', (name, text) => {
    const code = stripComments(text)
    const uses = /\b(?:transform|transition|animation)\s*:/.test(code)
    if (!uses) return
    // Every use must sit inside a no-preference block.
    const outside = code.replace(/@media \(prefers-reduced-motion: no-preference\)\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '')
    expect(outside, name).not.toMatch(/\b(?:transform|transition|animation)\s*:/)
  })
  it.each(Object.entries(css))('%s: radius stays at or below 12px (no 2xl look)', (name, text) => {
    const m = /--radius:\s*([\d.]+)(rem|px)/.exec(stripComments(text))
    if (!m) return
    const px = m[2] === 'rem' ? Number(m[1]) * 16 : Number(m[1])
    expect(px, name).toBeLessThanOrEqual(12)
  })
  it.each(Object.entries(css))('%s: spacing density never drops below 0.18rem (targets stay usable)', (name, text) => {
    const m = /--spacing:\s*([\d.]+)rem/.exec(stripComments(text))
    if (m) expect(Number(m[1]), name).toBeGreaterThanOrEqual(0.18)
  })
  it('dense packs restore normal spacing for coarse pointers', () => {
    for (const name of ['workbench', 'terminal']) {
      expect(css[name], name).toMatch(/@media \(pointer: coarse\)\s*\{[^}]*\{[^}]*--spacing:\s*0\.25rem/)
    }
  })
  it('dense packs keep button-like targets at 24px or more (WCAG 2.2 target size)', () => {
    for (const name of ['workbench', 'terminal']) {
      expect(css[name], name).toMatch(/:is\(button, \[role="button"\]\)\s*\{\s*min-block-size:\s*1\.5rem;\s*min-inline-size:\s*1\.5rem/)
    }
  })
  it('dense packs give the copy field input the same 24px floor as its button', () => {
    for (const name of ['workbench', 'terminal']) {
      expect(css[name], name).toMatch(/\[data-slot="copy-field-input"\]\s*\{\s*min-block-size:\s*1\.5rem;\s*\}/)
    }
  })
  it('packs override only tokens that exist in theme.css', () => {
    for (const [name, text] of Object.entries(css)) {
      for (const m of stripComments(text).matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)) {
        expect(theme.includes(m[1]) || m[1] === '--spacing', `${name}: ${m[1]} is not defined in theme.css`).toBe(true)
      }
    }
  })
  it('quiet mirrors the core values it restores', () => {
    for (const m of stripComments(css.quiet).matchAll(/^\s*(--(?:radius|text-[a-z0-9-]+|shadow-[a-z0-9]+|border|input|foreground|muted-foreground)):\s*([^;]+);/gm)) {
      expect(theme, `${m[1]}: ${m[2]}`).toContain(`${m[1]}: ${m[2]};`)
    }
  })
})

/* ------------------------------------------------------------------------------------------- contrast */

type RGB = [number, number, number]
const oklch = (v: string): RGB => {
  const m = v.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/)
  if (!m) throw new Error(`Unsupported colour: ${v}`)
  const [l, c, h] = [+m[1], +m[2], (+m[3] * Math.PI) / 180]
  const a = c * Math.cos(h), b = c * Math.sin(h)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3, m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3, s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_, -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_, -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_].map((x) => {
    const c2 = Math.min(1, Math.max(0, x))
    return c2 <= 0.0031308 ? 12.92 * c2 : 1.055 * c2 ** (1 / 2.4) - 0.055
  }) as RGB
}
const lum = ([r, g, b]: RGB) => {
  const f = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const ratio = (a: RGB, b: RGB) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
const tokens = (text: string, selector: RegExp): Record<string, string> => {
  const out: Record<string, string> = {}
  for (const b of stripComments(text).matchAll(/([^{}@;]+?)\{([^{}]*)\}/g)) {
    if (!selector.test(b[1].trim())) continue
    for (const d of b[2].matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) out[d[1]] = d[2].trim()
  }
  return out
}

describe('style packs: contrast pack ratios', () => {
  const light = { ...tokens(theme, /^:root$/), ...tokens(css.contrast, /^\[data-style="contrast"\]$/) }
  const dark = { ...light, ...tokens(theme, /^\.dark$/), ...tokens(css.contrast, /^\.dark\[data-style="contrast"\]/) }
  const pairs: [string, string, number][] = [
    ['foreground', 'background', 7], ['card-foreground', 'card', 7], ['popover-foreground', 'popover', 7],
    ['muted-foreground', 'background', 7], ['muted-foreground', 'card', 7], ['secondary-foreground', 'secondary', 7],
    ['border', 'background', 3], ['input', 'background', 4.5], ['input', 'card', 4.5],
  ]
  describe.each([['light', light], ['dark', dark]] as const)('%s', (_mode, t) => {
    it.each(pairs)('%s on %s is at least %s:1', (fg, bg, min) => {
      expect(ratio(oklch(t[`--${fg}`]), oklch(t[`--${bg}`])), `${fg} on ${bg}`).toBeGreaterThanOrEqual(min)
    })
  })
})

describe('style packs: raw keeps the ink contrast', () => {
  it('its borders and shadows use the foreground token, so they follow light and dark', () => {
    const code = stripComments(css.raw)
    expect(code).toMatch(/--border:\s*var\(--foreground\)/)
    expect(code).toMatch(/--shadow-md:\s*4px 4px 0 0 var\(--foreground\)/)
  })
})
