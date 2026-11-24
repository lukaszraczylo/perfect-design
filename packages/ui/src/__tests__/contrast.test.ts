/**
 * WCAG colour-contrast gate for every theme. Parses the real CSS token files (theme.css + themes/*.css + palettes/*.css),
 * converts oklch → sRGB and asserts contrast for the token pairings components actually use.
 *   text ≥ 4.5:1 (WCAG 1.4.3)  ·  UI boundaries / focus ring ≥ 3:1 (WCAG 1.4.11)
 */
import { describe, expect, it } from 'vitest'
import { trackStroke, trackSurface } from '../lib/styles'
import { timelineMarkerVariants, TIMELINE_STATUSES } from '../components/data-display/Timeline/variants'
import { color, oklchToRgb, over, parseColor, presets, ratio, resolve, rgbOf } from './contrast-helpers'

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

    // A progress, stat bar, gauge or KPI track is not a control boundary (no 3:1), but it must be perceivable: >= 1.5:1 against the page and a card.
    it('progress track (input blended over the surface) is >= 1.5:1 against background and card', () => {
      const alpha = Number(/^bg-input\/(\d+)$/.exec(trackSurface)![1]) / 100
      expect(trackStroke).toBe(`stroke-input/${Math.round(alpha * 100)}`)
      for (const name of ['background', 'card'] as const) {
        const surface = rgbOf(t, name)
        expect(ratio(over({ rgb: rgbOf(t, 'input'), alpha }, surface), surface), `track on ${name}`).toBeGreaterThanOrEqual(1.5)
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
