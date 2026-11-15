/**
 * WCAG colour-contrast gate for every theme. Parses the real CSS token files (theme.css + themes/*.css),
 * converts oklch → sRGB and asserts contrast for the token pairings components actually use.
 *   text ≥ 4.5:1 (WCAG 1.4.3)  ·  UI boundaries / focus ring ≥ 3:1 (WCAG 1.4.11)
 */
import { readdirSync, readFileSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'
import { describe, expect, it } from 'vitest'
import { timelineMarkerVariants, TIMELINE_STATUSES } from '../components/data-display/Timeline/variants'

const stylesDir = resolvePath(process.cwd(), 'src/styles') + '/' // vitest runs from packages/ui
const themeCss = { 'theme.css': readFileSync(`${stylesDir}theme.css`, 'utf8') } as Record<string, string>
const presetCss = Object.fromEntries(readdirSync(`${stylesDir}themes`).filter((f) => f.endsWith('.css')).map((f) => [`/${f}`, readFileSync(`${stylesDir}themes/${f}`, 'utf8')])) as Record<string, string>

type Tokens = Record<string, string>
type RGB = [number, number, number]

function parseBlocks(css: string): { selector: string; tokens: Tokens }[] {
  const out: { selector: string; tokens: Tokens }[] = []
  const re = /([^{}@;]+?)\{([^{}]*)\}/g
  for (const m of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(re)) {
    const selector = m[1].trim()
    const tokens: Tokens = {}
    for (const d of m[2].matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) tokens[d[1]] = d[2].trim()
    if (Object.keys(tokens).length) out.push({ selector, tokens })
  }
  return out
}

function oklchToRgb(l: number, c: number, hDeg: number): RGB {
  const h = (hDeg * Math.PI) / 180
  const a = c * Math.cos(h)
  const b = c * Math.sin(h)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const lin = [4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_, -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_, -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_]
  return lin.map((v) => {
    const c2 = Math.min(1, Math.max(0, v))
    return c2 <= 0.0031308 ? 12.92 * c2 : 1.055 * c2 ** (1 / 2.4) - 0.055
  }) as RGB
}

function parseColor(value: string): { rgb: RGB; alpha: number } {
  const m = value.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+))?\s*\)$/)
  if (!m) throw new Error(`Unsupported colour: ${value}`)
  return { rgb: oklchToRgb(+m[1], +m[2], +m[3]), alpha: m[4] ? +m[4] : 1 }
}

const lum = ([r, g, b]: RGB) => {
  const f = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const ratio = (a: RGB, b: RGB) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
const over = (fg: { rgb: RGB; alpha: number }, bg: RGB): RGB => fg.rgb.map((v, i) => v * fg.alpha + bg[i] * (1 - fg.alpha)) as RGB

function resolve(mode: 'light' | 'dark', preset: string | null): Tokens {
  const base = parseBlocks(Object.values(themeCss)[0])
  const tokens: Tokens = {}
  Object.assign(tokens, base.find((b) => b.selector === ':root')!.tokens)
  if (mode === 'dark') Object.assign(tokens, base.find((b) => b.selector === '.dark')!.tokens)
  if (preset) {
    const css = Object.entries(presetCss).find(([k]) => k.endsWith(`/${preset}.css`))![1]
    for (const b of parseBlocks(css)) {
      const isDark = b.selector.endsWith('.dark')
      if (isDark === (mode === 'dark')) Object.assign(tokens, b.tokens)
    }
  }
  return tokens
}

const presets = [null, ...Object.keys(presetCss).map((k) => k.match(/([^/]+)\.css$/)![1])]
const color = (t: Tokens, name: string) => parseColor(t[`--${name}`])
const rgbOf = (t: Tokens, name: string) => color(t, name).rgb

// [foreground token, background token] pairs that components render as text
const TEXT_PAIRS: [string, string][] = [
  ['foreground', 'background'], ['card-foreground', 'card'], ['popover-foreground', 'popover'],
  ['primary-foreground', 'primary'], ['secondary-foreground', 'secondary'], ['muted-foreground', 'background'],
  ['muted-foreground', 'card'], ['muted-foreground', 'muted'], ['accent-foreground', 'accent'],
  ['destructive-foreground', 'destructive'], ['success-foreground', 'success'], ['warning-foreground', 'warning'],
  ['info-foreground', 'info'], ['sidebar-foreground', 'sidebar'], ['sidebar-accent-foreground', 'sidebar-accent'],
  ['primary', 'background'], ['primary', 'card'], ['destructive', 'background'], ['success', 'background'], ['info', 'background'],
  // Surfaces added by the variation round: filled fields, muted/secondary panels and cards, accent hover fills, links on panels.
  ['foreground', 'card'], ['foreground', 'muted'], ['foreground', 'secondary'], ['foreground', 'accent'],
  ['muted-foreground', 'secondary'], ['primary', 'secondary'], ['primary', 'muted'], ['destructive', 'card'], ['success', 'card'], ['info', 'card'],
  // Chat family: option descriptions on the popover surface, the over-limit counter text on a filled (muted) prompt box.
  ['muted-foreground', 'popover'], ['destructive', 'muted'],
]

describe.each(['light', 'dark'] as const)('WCAG contrast — %s', (mode) => {
  describe.each(presets)('preset %s', (preset) => {
    const t = resolve(mode, preset)
    const bg = rgbOf(t, 'background')

    it.each(TEXT_PAIRS)('text %s on %s ≥ 4.5:1', (fg, back) => {
      const r = ratio(over(color(t, fg), rgbOf(t, back)), rgbOf(t, back))
      expect(r, `${fg} on ${back}`).toBeGreaterThanOrEqual(4.5)
    })

    it('form-control border (--input) ≥ 3:1 against background and card (WCAG 1.4.11)', () => {
      expect(ratio(rgbOf(t, 'input'), bg)).toBeGreaterThanOrEqual(3)
      expect(ratio(rgbOf(t, 'input'), rgbOf(t, 'card'))).toBeGreaterThanOrEqual(3)
    })

    it('focus ring ≥ 3:1 against background and card', () => {
      expect(ratio(rgbOf(t, 'ring'), bg)).toBeGreaterThanOrEqual(3)
      expect(ratio(rgbOf(t, 'ring'), rgbOf(t, 'card'))).toBeGreaterThanOrEqual(3)
    })

    it.each([['success', 0.15], ['info', 0.15], ['destructive', 0.1], ['primary', 0.1], ['warning', 0.2]] as const)(
      'tinted status text %s on %s tint ≥ 4.5:1',
      (tone, alpha) => {
        const tint = over({ rgb: rgbOf(t, tone), alpha }, bg)
        // warning badges use warning-foreground in light mode and warning in dark mode
        const textToken = tone === 'warning' ? (mode === 'light' ? 'warning-foreground' : 'warning') : tone
        // 4.7 rather than 4.5: Tailwind blends the tint in oklab, this test in sRGB; the margin covers the difference.
        expect(ratio(rgbOf(t, textToken), tint), `${textToken} on ${tone}/${alpha * 100}`).toBeGreaterThanOrEqual(4.7)
      },
    )

    it('warning outlines and strokes (warning-foreground in light, warning in dark) are >= 3:1 against background and card (WCAG 1.4.11)', () => {
      const stroke = mode === 'light' ? 'warning-foreground' : 'warning'
      expect(ratio(rgbOf(t, stroke), bg), `${stroke} on background`).toBeGreaterThanOrEqual(3)
      expect(ratio(rgbOf(t, stroke), rgbOf(t, 'card')), `${stroke} on card`).toBeGreaterThanOrEqual(3)
    })

    it.each(['success', 'info', 'destructive', 'primary'] as const)('%s used as a stroke or outline is >= 3:1 against background and card', (tone) => {
      expect(ratio(rgbOf(t, tone), bg), `${tone} on background`).toBeGreaterThanOrEqual(3)
      expect(ratio(rgbOf(t, tone), rgbOf(t, 'card')), `${tone} on card`).toBeGreaterThanOrEqual(3)
    })

    it('foreground ink border used by the pressed outline toggle is >= 3:1 against background and card', () => {
      expect(ratio(rgbOf(t, 'foreground'), bg)).toBeGreaterThanOrEqual(3)
      expect(ratio(rgbOf(t, 'foreground'), rgbOf(t, 'card'))).toBeGreaterThanOrEqual(3)
    })

    it.each(TIMELINE_STATUSES)('timeline outline marker ring (%s) is >= 3:1 against background and card (WCAG 1.4.11)', (status) => {
      const classes = timelineMarkerVariants({ variant: 'outline', status }).split(/\s+/)
      // The ring token: the `dark:` border class in dark mode when there is one, else the plain `border-<token>` class.
      const plain = classes.find((c) => /^border-(?!2$)[a-z-]+$/.test(c) && !/^border-(x|y|s|e|t|b|l|r)$/.test(c))!
      const dark = classes.find((c) => c.startsWith('dark:border-'))
      const token = (mode === 'dark' && dark ? dark.slice('dark:border-'.length) : plain.slice('border-'.length))
      expect(ratio(rgbOf(t, token), bg), `${token} on background`).toBeGreaterThanOrEqual(3)
      expect(ratio(rgbOf(t, token), rgbOf(t, 'card')), `${token} on card`).toBeGreaterThanOrEqual(3)
    })

    // Dark `filled` text fields use card; the outline field is input/30 over the surface. They must stay visibly different (>= 1.15:1);
    // the text pairs foreground/card and muted-foreground/card are in TEXT_PAIRS above. Light mode keeps muted and is unchanged.
    it.runIf(mode === 'dark')('filled field fill (card) is >= 1.15:1 away from the outline field fill (input/30) over the page and over a card', () => {
      const card = rgbOf(t, 'card')
      for (const [name, surface] of [['background', bg], ['card', card]] as const) {
        const outlineFill = over({ rgb: rgbOf(t, 'input'), alpha: 0.3 }, surface)
        expect(ratio(card, outlineFill), `card vs input/30 on ${name}`).toBeGreaterThanOrEqual(1.15)
      }
    })

    it('primary button hover (primary/90) keeps text contrast ≥ 4.5:1', () => {
      const hover = over({ rgb: rgbOf(t, 'primary'), alpha: 0.9 }, bg)
      expect(ratio(rgbOf(t, 'primary-foreground'), hover)).toBeGreaterThanOrEqual(4.5)
    })
  })
})

describe('colour maths sanity', () => {
  it('black on white is 21:1 and identical colours 1:1', () => {
    expect(ratio([0, 0, 0], [1, 1, 1])).toBeCloseTo(21, 0)
    expect(ratio([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])).toBeCloseTo(1, 5)
  })
  it('oklch(1 0 0) is white and oklch(0 0 0) is black', () => {
    expect(oklchToRgb(1, 0, 0).every((v) => Math.abs(v - 1) < 0.01)).toBe(true)
    expect(oklchToRgb(0, 0, 0).every((v) => v < 0.01)).toBe(true)
  })
  it('rejects unsupported colour syntax', () => expect(() => parseColor('#fff')).toThrow())
})

// DiffViewer: code text (foreground) sits on the added / removed row tints and on the changed-word tints; the markers
// (success / destructive text) sit on the row tints, which TEXT_PAIRS' tinted-status test above covers at the same alphas.
describe.each(['light', 'dark'] as const)('DiffViewer text on status tints — %s', (mode) => {
  describe.each(presets)('preset %s', (preset) => {
    const t = resolve(mode, preset)
    it.each([['success', 0.15], ['destructive', 0.1], ['success', 0.3], ['destructive', 0.2]] as const)('foreground on %s/%s tint over the card is >= 4.5:1', (tone, alpha) => {
      const card = rgbOf(t, 'card')
      expect(ratio(rgbOf(t, 'foreground'), over({ rgb: rgbOf(t, tone), alpha }, card)), `foreground on ${tone}/${alpha}`).toBeGreaterThanOrEqual(4.5)
    })
    it('success and destructive text on their row tints over the card is >= 4.5:1 (diff markers)', () => {
      const card = rgbOf(t, 'card')
      expect(ratio(rgbOf(t, 'success'), over({ rgb: rgbOf(t, 'success'), alpha: 0.15 }, card))).toBeGreaterThanOrEqual(4.5)
      expect(ratio(rgbOf(t, 'destructive'), over({ rgb: rgbOf(t, 'destructive'), alpha: 0.1 }, card))).toBeGreaterThanOrEqual(4.5)
    })
  })
})
