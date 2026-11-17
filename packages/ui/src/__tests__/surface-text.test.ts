/**
 * Surface text guard: a class string that paints a fill (bg-background, bg-card, bg-popover, bg-muted)
 * must also set a text colour, otherwise the surface inherits the parent's text colour and turns
 * white-on-white inside an inverted region (`bg-foreground text-background`).
 * Tokens behind interaction-only variants (hover:, focus-within:, group-*, arbitrary [&...]:) and parts
 * that hold no text are exempt; the text-free parts are listed explicitly below.
 */
import { describe, expect, it } from 'vitest'

const sources = import.meta.glob('../components/*/*/variants.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>

const FILL = /^bg-(background|card|popover|muted)(\/\d+)?$/
const TEXT_COLOUR =
  /^text-(foreground|background|card-foreground|popover-foreground|muted-foreground|primary-foreground|secondary-foreground|accent-foreground|destructive(-foreground)?|primary|success|warning|info|inherit|current)(\/\d+)?$/
const INERT_VARIANT = /^(hover|focus|focus-within|focus-visible|active|disabled|odd|even|first|last|forced-colors|dark|motion-reduce|motion-safe|pointer-coarse|group-.*|peer-.*|has-.*|in-.*|not-.*|\[.*)$/

/** Parts that paint a fill but never contain text (tracks, thumbs, skeletons, dots, bars, indicators). */
const TEXT_FREE: Array<[file: string, fragment: string]> = [
  ['Slider/variants.ts', 'relative grow overflow-hidden rounded-full bg-muted'],
  ['Slider/variants.ts', 'block shrink-0 rounded-full border-2 bg-background'],
  ['Switch/variants.ts', 'data-[state=unchecked]:bg-muted'],
  ['Switch/variants.ts', 'pointer-events-none block rounded-full bg-background'],
  ['Switch/variants.ts', 'dark:data-[state=checked]:bg-background'],
  ['Progress/variants.ts', 'relative w-full flex-auto overflow-hidden rounded-full bg-muted'],
  ['Progress/variants.ts', 'h-full flex-1 overflow-hidden rounded-full bg-muted'],
  ['Skeleton/variants.ts', 'bg-muted motion-reduce:animate-none'],
  ['ScrollArea/variants.ts', 'rounded-full bg-muted'],
  ['MediaFrame/variants.ts', 'rounded-full bg-muted-foreground/40'],
  ['ScrollProgress/variants.ts', 'overflow-hidden rounded-full bg-muted'],
  ['ImageGrid/variants.ts', 'min-h-11 w-full overflow-hidden border bg-muted'],
  ['BeforeAfter/variants.ts', 'select-none overflow-hidden border bg-muted'],
  ['BlogCard/variants.ts', 'aspect-video shrink-0 overflow-hidden bg-muted'],
  ['LogViewer/variants.ts', "black: 'bg-muted'"],
  ['InlineMessage/variants.ts', 'bg-muted'], // neutral tone sets text-muted-foreground in its own string
  ['Tree/variants.ts', 'unchecked: '],
  ['VirtualList/variants.ts', 'bg-muted/30'],
  ['DiffViewer/variants.ts', 'bg-muted/40'], // empty-side placeholder rows hold no text
  ['LogViewer/variants.ts', 'bg-muted'], // ANSI background swatch; the foreground colour comes from the FG map
  ['Table/variants.ts', 'bg-muted group-data-[sticky]/table:bg-muted'], // header base string already sets text-muted-foreground
  ['Tree/variants.ts', 'border-input bg-background'], // unchecked checkbox box
  ['BeforeAfter/variants.ts', 'bg-background'], // divider line / knob tone, no text
]

function stripComments(src: string) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
}

function offenders(file: string, src: string): string[] {
  const out: string[] = []
  const strings = [...stripComments(src).matchAll(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)].map((m) => m[2]!)
  for (const str of strings) {
    if (!str.includes('bg-')) continue
    const tokens = str.split(/\s+/).filter(Boolean)
    const hasBaseText = tokens.some((t) => TEXT_COLOUR.test(t))
    for (const token of tokens) {
      const parts = token.split(/:(?![^[]*\])/)
      const utility = parts.pop()!
      if (!FILL.test(utility)) continue
      if (parts.length > 0 && parts.every((p) => INERT_VARIANT.test(p))) continue
      const core = (list: string[]) => list.filter((p) => !INERT_VARIANT.test(p)).join(':')
      const prefix = core(parts)
      const covered =
        hasBaseText ||
        tokens.some((t) => {
          const segs = t.split(/:(?![^[]*\])/)
          return TEXT_COLOUR.test(segs.pop()!) && core(segs) === prefix
        })
      if (covered) continue
      if (TEXT_FREE.some(([f, frag]) => file.endsWith(f) && (str.includes(frag) || src.includes(frag) && str === frag))) continue
      out.push(`${file.replace('../components/', '')}: "${str.length > 90 ? `${str.slice(0, 90)}...` : str}" -> ${token}`)
    }
  }
  return out
}

describe('surface text guard', () => {
  it('scans every group', () => expect(Object.keys(sources).length).toBeGreaterThan(100))

  it('every fill sets a text colour in the same class string', () => {
    const all = Object.entries(sources).flatMap(([file, src]) => offenders(file, src))
    expect(all).toEqual([])
  })

  it('detects a fill without a text colour', () => {
    expect(offenders('x/Fake/variants.ts', "const a = 'border bg-background shadow-xs'")).toHaveLength(1)
    expect(offenders('x/Fake/variants.ts', "const a = 'border bg-background text-foreground'")).toEqual([])
    expect(offenders('x/Fake/variants.ts', "const a = 'hover:bg-muted data-[x]:bg-card text-foreground'")).toEqual([])
    expect(offenders('x/Fake/variants.ts', "const a = 'data-[on]:bg-card'")).toHaveLength(1)
    expect(offenders('x/Fake/variants.ts', "const a = 'data-[on]:bg-card data-[on]:hover:text-foreground'")).toEqual([])
  })
})
