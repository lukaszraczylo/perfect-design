/**
 * Pure helpers of ScatterChart: point normalisation, linear regression and the bubble radius scale.
 * No Vue, no DOM; unit-tested in scatterMath.test.ts.
 */
import { clamp, isFiniteNumber, niceTicks } from '../_chart/chartMath'
import { seriesTone, type ChartTone } from '../_chart/tones'

export interface ScatterPoint {
  x: number
  y: number
  /** Bubble size (area). Used by `variant="bubble"` and listed in the data table. */
  size?: number
  /** Name of the point: shown by `showValues`, in the tooltip and as the row header of the data table. */
  label?: string
  /** Series the point belongs to. Points without one form the series `Points`. */
  series?: string
}

export interface NormPoint {
  x: number
  y: number
  size: number | null
  label: string
  /** Index in the input array, so tooltips and the table keep the order the consumer gave. */
  index: number
}

export interface NormSeries {
  name: string
  tone: ChartTone
  points: NormPoint[]
}

export interface NormScatter {
  series: NormSeries[]
  /** Valid points over all series. */
  count: number
  /** Points dropped because x or y is not a finite number. */
  skipped: number
  hasSize: boolean
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Tolerant normalisation: bad entries and non-finite coordinates are skipped (and counted), series keep first-seen order. */
export function normalizePoints(points: unknown, tones?: Record<string, ChartTone | undefined>): NormScatter {
  const list = Array.isArray(points) ? points : []
  const byName = new Map<string, NormSeries>()
  let skipped = 0
  let count = 0
  let hasSize = false
  list.forEach((raw: unknown, index: number) => {
    if (!isRecord(raw) || !isFiniteNumber(raw.x) || !isFiniteNumber(raw.y)) {
      skipped++
      return
    }
    const name = typeof raw.series === 'string' && raw.series.trim() ? raw.series : 'Points'
    let s = byName.get(name)
    if (!s) {
      s = { name, tone: seriesTone(byName.size, tones?.[name]), points: [] }
      byName.set(name, s)
    }
    const size = isFiniteNumber(raw.size) && raw.size >= 0 ? raw.size : null
    if (size !== null) hasSize = true
    s.points.push({ x: raw.x, y: raw.y, size, label: typeof raw.label === 'string' ? raw.label : '', index })
    count++
  })
  return { series: [...byName.values()], count, skipped, hasSize }
}

export interface Regression {
  slope: number
  intercept: number
  /** Coefficient of determination, 0..1 (1 when every point lies on the line). */
  r2: number
}

/** Least squares line through the points. `null` with fewer than two points or when all x are equal (no slope exists). */
export function linearRegression(pts: readonly { x: number; y: number }[]): Regression | null {
  const n = pts.length
  if (n < 2) return null
  // Centre the data first: it keeps the sums finite for huge coordinates.
  let mx = 0
  let my = 0
  for (const p of pts) {
    mx += p.x / n
    my += p.y / n
  }
  let sxx = 0
  let sxy = 0
  let syy = 0
  for (const p of pts) {
    const dx = p.x - mx
    const dy = p.y - my
    sxx += dx * dx
    sxy += dx * dy
    syy += dy * dy
  }
  if (!(sxx > 0) || !Number.isFinite(sxx) || !Number.isFinite(sxy)) return null
  const slope = sxy / sxx
  const intercept = my - slope * mx
  if (!isFiniteNumber(slope) || !isFiniteNumber(intercept)) return null
  const r2 = syy > 0 && Number.isFinite(syy) ? Math.min(1, (sxy * sxy) / (sxx * syy)) : 1
  return { slope, intercept, r2 }
}

/**
 * The part of the regression line to draw: from `xa` to `xb`, cut where it leaves the value range [ylo, yhi], so the
 * trend never runs outside the plot. `null` when no part of it is inside.
 */
export function trendSegment(reg: Regression, xa: number, xb: number, ylo: number, yhi: number): [number, number, number, number] | null {
  let a = Math.min(xa, xb)
  let b = Math.max(xa, xb)
  const { slope, intercept } = reg
  if (slope !== 0) {
    const t1 = (ylo - intercept) / slope
    const t2 = (yhi - intercept) / slope
    a = Math.max(a, Math.min(t1, t2))
    b = Math.min(b, Math.max(t1, t2))
  } else if (intercept < ylo || intercept > yhi) return null
  if (!(a <= b)) return null
  return [a, slope * a + intercept, b, slope * b + intercept]
}

/** `y = 0.5x + 2` with at most 3 significant digits; used in the text summary of a trend. */
export function describeRegression(reg: Regression, fmt: (n: number) => string): string {
  const sign = reg.intercept < 0 ? '-' : '+'
  return `y = ${fmt(reg.slope)}x ${sign} ${fmt(Math.abs(reg.intercept))} (R squared ${Math.round(reg.r2 * 100) / 100})`
}

/** Area-proportional radius: a point with the largest size gets `rMax`; smaller ones shrink with the square root, never below `rMin`. */
export function bubbleRadius(size: number | null, maxSize: number, rMin: number, rMax: number): number {
  if (size === null || !(maxSize > 0)) return rMin
  return Math.max(rMin, Math.min(rMax, rMax * Math.sqrt(size / maxSize)))
}

/** 1 / 2 / 5 / 10 x 10^n nearest to `x` (rounding half up the ladder at 1.5, 3 and 7). */
function roundStep(x: number): number {
  const exp = Math.floor(Math.log10(x))
  const frac = x / 10 ** exp
  return (frac < 1.5 ? 1 : frac < 3 ? 2 : frac < 7 ? 5 : 10) * 10 ** exp
}

/**
 * Ticks for a numeric axis: round steps, about `count` of them, covering [min, max] with as little slack as the steps
 * allow (`niceTicks` rounds the whole range up first, which wastes a third of a scatter plot). Degenerate input falls
 * back to `niceTicks`, which pads it.
 */
export function axisTicks(min: number, max: number, count: number): number[] {
  const range = max - min
  if (!isFiniteNumber(min) || !isFiniteNumber(max) || !isFiniteNumber(range) || range <= 0) return niceTicks(min, max, count)
  const step = roundStep(range / (clamp(Math.floor(count), 2, 12) - 1))
  if (!(step > 0) || !Number.isFinite(step)) return niceTicks(min, max, count)
  const start = Math.floor(min / step) * step
  const end = Math.ceil(max / step) * step
  const decimals = clamp(-Math.floor(Math.log10(step)) + 1, 0, 12)
  const total = Math.min(100, Math.round((end - start) / step))
  const out: number[] = []
  for (let i = 0; i <= total; i++) {
    const t = Number((start + i * step).toFixed(decimals))
    out.push(t === 0 ? 0 : t)
  }
  return out
}
