/**
 * Text helpers: width estimate, wrapping, entity decoding and the metrics every renderer shares.
 * Width is an estimate (no DOM access, so it is deterministic and works on the server): glyph classes with average
 * advance widths of a humanist sans, slightly generous so labels do not touch their border.
 */
import { estimateTextWidth } from '../_chart/chartKit'
import type { DiagramDensity, DiagramRounded, DiagramSize, Metrics } from './types'

const NARROW = new Set("iljtfI.,:;'|!()[]/\\ ")
const WIDE = new Set('mwMW@%')
const CJK = /[ᄀ-ᇿ⺀-꓏가-힯豈-﫿︰-﹏＀-｠\u{1f000}-\u{1faff}]/u

/** Estimated rendered width of `text` at `fontPx`. Falls back to the chart estimate for plain ASCII-free input. */
export function measureText(text: string, fontPx: number, bold = false): number {
  let em = 0
  for (const ch of text) {
    if (CJK.test(ch)) em += 1
    else if (NARROW.has(ch)) em += 0.32
    else if (WIDE.has(ch)) em += 0.86
    else if (ch >= 'A' && ch <= 'Z') em += 0.66
    else em += 0.57
  }
  return Math.max(em * fontPx * (bold ? 1.06 : 1), text.length === 0 ? 0 : estimateTextWidth('i', fontPx))
}

const NAMED: Record<string, string> = { quot: '"', amp: '&', lt: '<', gt: '>', apos: "'", nbsp: ' ', hash: '#', semi: ';' }

/** Mermaid entity codes (`#quot;`, `#35;`) and a few HTML entities become characters. Anything else stays as written. */
export function decodeEntities(text: string): string {
  return text.replace(/#(?:(\d{1,6})|([a-z]{2,6}));|&(?:#(\d{1,6})|([a-z]{2,6}));/gi, (all, n1: string, w1: string, n2: string, w2: string) => {
    const code = n1 ?? n2
    if (code !== undefined) {
      const cp = Number(code)
      return cp > 0 && cp < 0x110000 && !(cp >= 0xd800 && cp <= 0xdfff) ? String.fromCodePoint(cp) : all
    }
    return NAMED[(w1 ?? w2).toLowerCase()] ?? all
  })
}

/** A label as plain text lines: `<br>` and `\n` break lines, markdown emphasis and html tags are dropped, entities decoded. */
export function cleanLabel(raw: string): string[] {
  let t = raw.trim()
  if (t.startsWith('"') && t.endsWith('"') && t.length >= 2) t = t.slice(1, -1)
  if (t.startsWith('`') && t.endsWith('`') && t.length >= 2) t = t.slice(1, -1)
  t = t.replace(/<br\s*\/?>|\\n/gi, '\n')
  // HTML tags are never rendered: they are dropped and only their text stays
  t = t.replace(/<\/?[a-z][^<>]*>/gi, '')
  // emphasis markers only when they wrap a word or phrase, never inside words (snake_case_name stays intact)
  t = t.replace(/(?<![\w*_])(\*\*|__)(?=\S)(.+?)(?<=\S)\1(?![\w*_])/g, '$2').replace(/(?<![\w*_])([*_])(?=\S)(.+?)(?<=\S)\1(?![\w*_])/g, '$2')
  t = decodeEntities(t)
  return t.split('\n').map((l) => l.trim()).filter((l, i, a) => l !== '' || a.length === 1)
}

/** Wrap text to lines no wider than `maxWidth`; words longer than a line are broken by character. */
export function wrapText(text: string, maxWidth: number, fontPx: number, bold = false): string[] {
  const out: string[] = []
  const limit = Math.max(maxWidth, fontPx * 2)
  for (const para of text.split('\n')) {
    const words = para.split(/\s+/).filter(Boolean)
    if (words.length === 0) {
      out.push('')
      continue
    }
    let line = ''
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (measureText(candidate, fontPx, bold) <= limit) {
        line = candidate
        continue
      }
      if (line) out.push(line)
      line = ''
      let rest = word
      while (measureText(rest, fontPx, bold) > limit) {
        let cut = 1
        while (cut < rest.length && measureText(rest.slice(0, cut + 1), fontPx, bold) <= limit) cut++
        // never split a surrogate pair
        if (cut < rest.length && /[\ud800-\udbff]/.test(rest[cut - 1]!)) cut++
        out.push(rest.slice(0, cut))
        rest = rest.slice(cut)
      }
      line = rest
    }
    if (line) out.push(line)
  }
  return out.length ? out : ['']
}

/** Wrap each pre-split label line and return the lines plus their block size. */
export function labelBlock(lines: string[], maxWidth: number, fontPx: number, lineHeight: number, bold = false): { lines: string[]; width: number; height: number } {
  const wrapped = lines.flatMap((l) => wrapText(l, maxWidth, fontPx, bold))
  const width = Math.max(0, ...wrapped.map((l) => measureText(l, fontPx, bold)))
  return { lines: wrapped, width, height: wrapped.length * lineHeight }
}

const FONT: Record<DiagramSize, number> = { sm: 12, md: 14, lg: 16 }
const DENSITY: Record<DiagramDensity, number> = { compact: 0.7, comfortable: 1, spacious: 1.4 }
const RADIUS: Record<DiagramRounded, number> = { none: 0, sm: 3, md: 8, full: 999 }

const pick = <T extends string>(map: Record<T, number>, key: unknown, fallback: T): number => map[typeof key === 'string' && Object.hasOwn(map, key) ? (key as T) : fallback]

/** Spacing and type metrics. Unknown values fall back to `md` / `comfortable`. */
export function metricsFor(size?: unknown, density?: unknown, rounded?: unknown): Metrics {
  const font = pick(FONT, size, 'md')
  const d = pick(DENSITY, density, 'comfortable')
  return {
    font,
    lineHeight: Math.round(font * 1.4),
    padX: Math.round(font * 0.9 * (0.7 + d * 0.3)),
    padY: Math.round(font * 0.6 * (0.7 + d * 0.3)),
    nodeSep: Math.round(font * 2 * d),
    rankSep: Math.round(font * 3.2 * d),
    radius: pick(RADIUS, rounded, 'md'),
    wrap: Math.round(font * 13),
    margin: 16,
  }
}

export const r2 = (n: number): number => Math.round(n * 100) / 100

/** Truncate with an ellipsis to fit `maxWidth`. */
export function truncateToWidth(text: string, maxWidth: number, fontPx: number): string {
  if (measureText(text, fontPx) <= maxWidth) return text
  let end = text.length
  while (end > 1 && measureText(`${text.slice(0, end)}…`, fontPx) > maxWidth) end--
  return `${text.slice(0, end)}…`
}

export const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`
