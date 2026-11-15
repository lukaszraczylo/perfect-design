/**
 * Pure helpers of FunnelChart: stage normalisation, conversion rates and the geometry of the four variants in both
 * orientations. No Vue, no DOM; unit-tested in funnelMath.test.ts.
 */
import { clamp, isFiniteNumber, r2 } from '../_chart/chartMath'
import { toneClasses, type ChartTone } from '../_chart/tones'

export interface FunnelStageInput {
  label: string
  /** Size of the stage (visitors, orders, ...). Negative values draw nothing; non-finite ones read "n/a". */
  value: number
  /** Tone of this stage. Defaults to the chart's `tone`. */
  tone?: ChartTone
}

export interface NormStage {
  label: string
  /** `null` when the value is not a finite number. */
  value: number | null
  tone: ChartTone | undefined
  index: number
}

/** More stages than this are not drawn (the funnel would be taller than any screen); the hidden table lists up to 200. */
export const FUNNEL_MAX_STAGES = 50

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Tolerant normalisation: entries that are not objects are skipped, missing labels become `Stage n`. */
export function normalizeStages(stages: unknown): { stages: NormStage[]; total: number } {
  const list = Array.isArray(stages) ? stages.filter(isRecord) : []
  const all = list.map((s, index): NormStage => ({
    label: typeof s.label === 'string' && s.label.trim() ? s.label : `Stage ${index + 1}`,
    value: isFiniteNumber(s.value) ? s.value : null,
    tone: typeof s.tone === 'string' && s.tone in toneClasses ? (s.tone as ChartTone) : undefined,
    index,
  }))
  return { stages: all.slice(0, FUNNEL_MAX_STAGES), total: all.length }
}

/** Width of each stage as a share (0..1) of the widest one. Negative and missing values are 0. */
export function stageFractions(values: readonly (number | null)[]): number[] {
  let max = 0
  for (const v of values) if (v !== null && v > max) max = v
  return values.map((v) => (v !== null && v > 0 && max > 0 ? v / max : 0))
}

export interface Conversions {
  /** Percent of the previous stage; `null` for the first stage, when either value is missing or negative, or the previous is 0. */
  previous: (number | null)[]
  /** Percent of the first stage. */
  first: (number | null)[]
}

const percent = (v: number | null, base: number | null): number | null => {
  if (v === null || base === null || base <= 0 || v < 0) return null
  const p = (v / base) * 100
  return Number.isFinite(p) ? Math.round(p * 10) / 10 : null
}

export function conversions(values: readonly (number | null)[]): Conversions {
  return {
    previous: values.map((v, i) => (i === 0 ? null : percent(v, values[i - 1]!))),
    first: values.map((v, i) => (i === 0 ? null : percent(v, values[0]!))),
  }
}

/** `62.5%`, or `n/a` for a missing rate. Huge rates are compacted (`1200%`). */
export function formatPercent(p: number | null): string {
  if (p === null) return 'n/a'
  return `${Math.abs(p) >= 10000 ? new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(p) : String(p)}%`
}

export type FunnelVariant = 'funnel' | 'pyramid' | 'bars' | 'steps'
export type FunnelOrientation = 'vertical' | 'horizontal'

export interface GeometryOptions {
  variant: FunnelVariant
  orientation: FunnelOrientation
  /** Plot rectangle in viewBox units. */
  x0: number
  y0: number
  x1: number
  y1: number
  /** Space between neighbouring stages along the main axis. */
  gap: number
}

export interface StageGeometry {
  index: number
  /** Closed path of the stage, `''` when it has no area. */
  d: string
  x0: number
  y0: number
  x1: number
  y1: number
  /** Width and height of the largest upright rectangle that fits in the stage (what text inside it may use). */
  innerW: number
  innerH: number
}

/**
 * Shapes of the stages. The main axis runs top to bottom (vertical) or start to end (horizontal); the cross axis is
 * the width of a stage. `funnel` joins each stage to the next (the edge towards the next stage has the next value),
 * `pyramid` is the same shape stacked the other way round (the first stage is the base), `steps` centres a rectangle
 * per stage and `bars` aligns the rectangles to the start (left, or bottom when horizontal).
 */
export function funnelGeometry(fractions: readonly number[], o: GeometryOptions): StageGeometry[] {
  const n = fractions.length
  if (n === 0) return []
  const vertical = o.orientation === 'vertical'
  const mStart = vertical ? o.y0 : o.x0
  const mEnd = vertical ? o.y1 : o.x1
  const cStart = vertical ? o.x0 : o.y0
  const cEnd = vertical ? o.x1 : o.y1
  const half = Math.max(0, (cEnd - cStart) / 2)
  const centre = (cStart + cEnd) / 2
  const run = Math.max(0, mEnd - mStart)
  const gap = clamp(o.gap, 0, (run / n) * 0.5)
  const thickness = Math.max(0, (run - gap * (n - 1)) / n)
  const pyramid = o.variant === 'pyramid'
  const taper = o.variant === 'funnel' || pyramid
  const toXY = (m: number, c: number): [number, number] => (vertical ? [c, m] : [m, c])
  return fractions.map((f, i) => {
    const slot = pyramid ? n - 1 - i : i
    const a = mStart + slot * (thickness + gap)
    const b = a + thickness
    const next = i + 1 < n ? fractions[i + 1]! : f
    const [wa, wb] = !taper ? [f, f] : pyramid ? [next, f] : [f, next]
    const bars = o.variant === 'bars'
    // Cross-axis extent of the stage at its two edges.
    const span = (w: number): [number, number] => (bars ? (vertical ? [cStart, cStart + 2 * half * w] : [cEnd - 2 * half * w, cEnd]) : [centre - half * w, centre + half * w])
    const [a0, a1] = span(wa)
    const [b0, b1] = span(wb)
    const pts = [toXY(a, a0), toXY(a, a1), toXY(b, b1), toXY(b, b0)]
    const xs = pts.map((p) => p[0])
    const ys = pts.map((p) => p[1])
    const narrow = 2 * half * Math.min(wa, wb)
    const d = wa === 0 && wb === 0 ? '' : `M${pts.map((p) => `${r2(p[0])},${r2(p[1])}`).join(' L')} Z`
    return {
      index: i,
      d,
      x0: r2(Math.min(...xs)),
      y0: r2(Math.min(...ys)),
      x1: r2(Math.max(...xs)),
      y1: r2(Math.max(...ys)),
      innerW: r2(vertical ? narrow : thickness),
      innerH: r2(vertical ? thickness : narrow),
    }
  })
}

