/**
 * Layout helpers shared by BarChart / LineChart (category + series charts). Pure, no Vue, tolerant of bad input.
 */
import { isFiniteNumber } from './chartMath'
import { seriesTone, type ChartTone } from './tones'

export interface ChartSeries {
  name: string
  data: number[]
  tone?: ChartTone
}

export interface NormalizedSeries {
  name: string
  tone: ChartTone
  /** Length === count; non-finite / missing values are `null`. */
  data: (number | null)[]
}

export interface NormalizedChart {
  count: number
  categories: string[]
  series: NormalizedSeries[]
}

/**
 * Tolerant normalisation of `labels` + `series`: count = max(labels.length, longest series),
 * missing labels become '', non-finite values become null, invalid series entries are skipped.
 */
export function normalizeSeries(labels: unknown, series: unknown): NormalizedChart {
  const labelList = Array.isArray(labels) ? labels : []
  const seriesList = (Array.isArray(series) ? series : []).filter(
    (s): s is Partial<ChartSeries> => typeof s === 'object' && s !== null,
  )
  let count = labelList.length
  for (const s of seriesList) if (Array.isArray(s.data) && s.data.length > count) count = s.data.length
  const categories: string[] = []
  for (let i = 0; i < count; i++) {
    const l = labelList[i]
    categories.push(l === undefined || l === null ? '' : String(l))
  }
  const out: NormalizedSeries[] = seriesList.map((s, i) => {
    const raw = Array.isArray(s.data) ? s.data : []
    const data: (number | null)[] = []
    for (let k = 0; k < count; k++) {
      const v = raw[k]
      data.push(isFiniteNumber(v) ? v : null)
    }
    return {
      name: typeof s.name === 'string' && s.name ? s.name : `Series ${i + 1}`,
      tone: seriesTone(i, s.tone),
      data,
    }
  })
  return { count, categories, series: out }
}

/** True when at least one series has a finite value. */
export function hasValues(chart: NormalizedChart): boolean {
  return chart.series.some((s) => s.data.some((v) => v !== null))
}

/**
 * Advance widths in em per glyph class, measured on IBM Plex Sans (regular, the docs and theme font) and rounded UP to the
 * next step, so the estimate errs wide: a label gutter built from it keeps a few pixels of air instead of clipping.
 * Digits are 0.60 in that face; `W`, `m`, `@` and `%` are the widest Latin glyphs (0.87 to 0.93).
 */
const GLYPH_CLASSES: readonly (readonly [number, string])[] = [
  [0.3, " ',.:;!ijl"],
  [0.38, '|[](){}ft·r'],
  [0.42, '-I"/\\'],
  [0.55, '*?z°svycxJkLgaåeé≤≥çÇ'],
  [0.6, "0123456789+<=>^`~×±_oFhnuüñøTZbdpqSEY–£$"],
  [0.68, 'PVXCKRABDUß'],
  [0.72, 'GHNOQ&#'],
  [0.82, 'wM—…'],
  [0.93, 'mW@%ÆŒ'],
]
const GLYPH_EM = new Map<string, number>(GLYPH_CLASSES.flatMap(([em, chars]) => [...chars].map((ch) => [ch, em] as const)))
/** Other Latin and symbol glyphs: a little wider than the average lowercase letter. */
const GLYPH_DEFAULT_EM = 0.62
/** CJK, Hangul, full-width forms and emoji take about one em. */
const GLYPH_FULL_WIDTH = /[ᄀ-ᇿ⺀-꓏가-힯豈-﫿︰-﹏＀-｠\u{1f000}-\u{1faff}]/u

/**
 * Approximate rendered width of `text` at `fontPx`. Pure and deterministic (no DOM, so it also works on the server): every
 * glyph is looked up in a width class (narrow `i l .`, regular, wide `m W @`) instead of one average, which keeps
 * `MMMMWWWW` from being estimated like `iiiiiiii`. Counts code points, so an emoji is one glyph.
 */
export function estimateTextWidth(text: string, fontPx = 10): number {
  let em = 0
  for (const ch of text) em += GLYPH_EM.get(ch) ?? (GLYPH_FULL_WIDTH.test(ch) ? 1 : GLYPH_DEFAULT_EM)
  return em * fontPx
}

/**
 * `text` cut with an ellipsis so that its estimated width is at most `maxPx`. Text that already fits is returned as is; a
 * budget too small for even the ellipsis gives the ellipsis alone (a label is never silently dropped).
 */
export function fitText(text: string, maxPx: number, fontPx = 10): string {
  if (!isFiniteNumber(maxPx) || estimateTextWidth(text, fontPx) <= maxPx) return text
  const chars = [...text]
  while (chars.length > 0 && estimateTextWidth(`${chars.join('').trimEnd()}…`, fontPx) > maxPx) chars.pop()
  return chars.length === 0 ? '…' : `${chars.join('').trimEnd()}…`
}

/**
 * `text-anchor` for a label centred on `x`: `end` / `start` when a centred label would cross the right / left edge of a
 * viewBox `viewWidth` wide, so the first and last tick labels are never clipped. `middle` otherwise.
 */
export function edgeAnchor(x: number, text: string, viewWidth: number, fontPx = 12, safety = 4): 'start' | 'middle' | 'end' {
  const half = (estimateTextWidth(text, fontPx) + safety) / 2
  if (x + half > viewWidth) return 'end'
  if (x - half < 0) return 'start'
  return 'middle'
}

/** Space between a right-aligned axis label and the axis (the label's x is `x0 - LABEL_GAP`). */
export const LABEL_GAP = 6
/** Extra pixels for what the estimate misses: another fallback font, hinting, a slightly heavier weight. */
export const LABEL_SAFETY = 4
/** Width of the gutter that holds right-aligned axis labels: the widest estimate plus `LABEL_GAP` and `LABEL_SAFETY`. */
export function labelGutter(widestPx: number): number {
  return Math.ceil(isFiniteNumber(widestPx) && widestPx > 0 ? widestPx : 0) + LABEL_GAP + LABEL_SAFETY
}

/** Truncate to `max` chars with an ellipsis. `max < 1` is treated as 1. */
export function truncateLabel(text: string, max: number): string {
  const m = Math.max(1, Math.floor(Number.isFinite(max) ? max : 1))
  return text.length > m ? `${text.slice(0, Math.max(0, m - 1))}…` : text
}

/** Show every n-th label so labels of `labelPx` width fit into slots of `slotPx`. Always ≥ 1. */
export function labelStep(slotPx: number, labelPx: number): number {
  if (!isFiniteNumber(slotPx) || !isFiniteNumber(labelPx) || slotPx <= 0 || labelPx <= 0) return 1
  return Math.max(1, Math.ceil(labelPx / slotPx))
}

/**
 * Linear scale that never yields NaN/Infinity (huge domains like ±1e308 are scaled in halves);
 * a zero-width domain maps to the middle of the range.
 */
export function scaleSafe(d0: number, d1: number, r0: number, r1: number): (v: number) => number {
  const mid = (r0 + r1) / 2
  const span = d1 / 2 - d0 / 2
  if (!isFiniteNumber(span) || span === 0) return () => mid
  return (v) => {
    const t = (v / 2 - d0 / 2) / span
    const y = r0 + t * (r1 - r0)
    return isFiniteNumber(y) ? y : mid
  }
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}

/** Positive finite number or the fallback. */
export function dimension(v: unknown, fallback: number): number {
  return isFiniteNumber(v) && v > 0 ? v : fallback
}

export type ChartSize = 'sm' | 'md' | 'lg'

/** ViewBox height per `size` of BarChart / LineChart (`md` is the long-standing default of 240). */
export const CHART_HEIGHTS: Record<ChartSize, number> = { sm: 160, md: 240, lg: 320 }

/** An explicit `height` wins; otherwise the height of `size` (unknown sizes fall back to `md`). */
export function chartHeight(size: unknown, height?: unknown): number {
  const fallback = CHART_HEIGHTS[size as ChartSize] ?? CHART_HEIGHTS.md
  return dimension(height, fallback)
}

export type BarRounded = 'auto' | 'none' | 'sm' | 'md' | 'full'

/**
 * Corner radius of a bar. `auto` keeps the original look (2 for grouped bars, square for stacked segments);
 * `full` is a pill (half the shorter side). Unknown values behave like `auto`.
 */
export function barRadius(rounded: unknown, stacked: boolean, w: number, h: number): number {
  switch (rounded) {
    case 'none':
      return 0
    case 'sm':
      return Math.min(2, w / 2, h / 2)
    case 'md':
      return Math.min(4, w / 2, h / 2)
    case 'full':
      return Math.max(0, Math.min(w, h) / 2)
    default:
      return stacked ? 0 : 2
  }
}

export type BarGap = 'sm' | 'md' | 'lg'

/** Share of a category band that the bars occupy (`md` = the original 70%). */
export const BAR_FILL: Record<BarGap, number> = { sm: 0.85, md: 0.7, lg: 0.5 }

export function barFill(gap: unknown): number {
  return BAR_FILL[gap as BarGap] ?? BAR_FILL.md
}

export type MarkerShape = 'circle' | 'square' | 'diamond' | 'triangle'
export const MARKER_SHAPES: readonly MarkerShape[] = ['circle', 'square', 'diamond', 'triangle']

/** Marker of the n-th series when markers differ per series (a non-colour cue). */
export function seriesMarker(index: number): MarkerShape {
  return MARKER_SHAPES[(Number.isFinite(index) ? Math.abs(Math.floor(index)) : 0) % MARKER_SHAPES.length]!
}

/** Closed path of a non-circular marker centred on (cx, cy) with nominal radius r. Circles are drawn as `<circle>`. */
export function markerPath(shape: MarkerShape, cx: number, cy: number, r: number): string {
  const f = (n: number) => Math.round(n * 100) / 100
  if (shape === 'square') return `M${f(cx - r)},${f(cy - r)} h${f(2 * r)} v${f(2 * r)} h${f(-2 * r)} Z`
  if (shape === 'diamond') {
    const d = r * 1.3
    return `M${f(cx)},${f(cy - d)} L${f(cx + d)},${f(cy)} L${f(cx)},${f(cy + d)} L${f(cx - d)},${f(cy)} Z`
  }
  const h = r * 1.25
  return `M${f(cx)},${f(cy - h)} L${f(cx + h)},${f(cy + h * 0.8)} L${f(cx - h)},${f(cy + h * 0.8)} Z`
}

/** `value` when it is one of `allowed`, otherwise `fallback`. Keeps unknown variant values on the default look. */
export function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly unknown[]).includes(value) ? (value as T) : fallback
}
